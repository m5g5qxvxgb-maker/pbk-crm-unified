const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

// File filter - validate file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, images, ZIP, RAR'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

/**
 * POST /api/uploads
 * Upload a file for a lead
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { lead_id, file_type, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!lead_id) {
      // Delete uploaded file if lead_id missing
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'lead_id is required' });
    }
    
    await client.query('BEGIN');
    
    // Verify lead exists
    const leadCheck = await client.query(
      'SELECT id FROM leads WHERE id = $1',
      [lead_id]
    );
    
    if (leadCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Insert file record
    const result = await client.query(
      `INSERT INTO lead_attachments 
        (lead_id, filename, original_filename, file_path, file_size, mime_type, file_type, description, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        lead_id,
        file.filename,
        file.originalname,
        `/uploads/${file.filename}`,
        file.size,
        file.mimetype,
        file_type || 'document',
        description || null,
        req.user.id
      ]
    );
    
    // Log activity
    await client.query(
      `INSERT INTO activities 
        (entity_type, entity_id, activity_type, description, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'lead',
        lead_id,
        'file_uploaded',
        `Uploaded file: ${file.originalname}`,
        req.user.id
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      attachment: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Delete uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    console.error('Error uploading file:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB' });
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/uploads/lead/:lead_id
 * Get all files for a lead
 */
router.get('/lead/:lead_id', authenticateToken, async (req, res) => {
  try {
    const { lead_id } = req.params;
    
    const result = await db.query(
      `SELECT la.id, la.filename, la.original_filename, la.file_path, 
              la.file_size, la.mime_type, la.file_type, la.description,
              la.uploaded_by, la.created_at,
              u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM lead_attachments la
       LEFT JOIN users u ON la.uploaded_by = u.id
       WHERE la.lead_id = $1
       ORDER BY la.created_at DESC`,
      [lead_id]
    );
    
    res.json({
      success: true,
      attachments: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

/**
 * GET /api/uploads/:id/download
 * Download a file
 */
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info
    const result = await db.query(
      'SELECT * FROM lead_attachments WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = result.rows[0];
    const filePath = path.join(__dirname, '../../', file.file_path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
    res.setHeader('Content-Length', file.file_size);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

/**
 * DELETE /api/uploads/:id
 * Delete a file
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Get file info
    const fileResult = await client.query(
      'SELECT * FROM lead_attachments WHERE id = $1',
      [id]
    );
    
    if (fileResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'File not found' });
    }
    
    const fileRecord = fileResult.rows[0];
    
    // Delete from database
    await client.query(
      'DELETE FROM lead_attachments WHERE id = $1',
      [id]
    );
    
    // Log activity
    await client.query(
      `INSERT INTO activities 
        (entity_type, entity_id, activity_type, description, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'lead',
        fileRecord.lead_id,
        'file_deleted',
        `Deleted file: ${fileRecord.original_filename}`,
        req.user.id
      ]
    );
    
    await client.query('COMMIT');
    
    // Delete physical file
    const filePath = path.join(uploadDir, fileRecord.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  } finally {
    client.release();
  }
});

module.exports = router;
