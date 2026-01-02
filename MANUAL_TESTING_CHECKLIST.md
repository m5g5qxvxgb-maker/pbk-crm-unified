# PBK CRM - Manual Testing Checklist
## Complete Testing Guide for All Features

**Test Date:** _____________
**Tester:** _____________
**Version:** 1.0.0

---

## 1. SYSTEM ACCESS & AUTHENTICATION

### 1.1 Login System
- [ ] Navigate to http://localhost:3000/login
- [ ] Enter valid credentials (admin/admin123)
- [ ] Click "Login" button
- [ ] Verify redirect to dashboard
- [ ] Check session persists after page refresh
- [ ] Test logout functionality
- [ ] Test invalid credentials show error message
- [ ] Test empty form validation

**Notes:** _________________________________________________

---

## 2. DASHBOARD

### 2.1 Dashboard Overview
- [ ] Dashboard loads without errors
- [ ] All statistics cards display correctly
- [ ] Numbers are accurate and formatted properly
- [ ] Charts render correctly
- [ ] Recent activity feed shows latest items
- [ ] Quick actions buttons are clickable
- [ ] No console errors in browser DevTools

**Notes:** _________________________________________________

---

## 3. CLIENTS MODULE

### 3.1 Clients List
- [ ] Navigate to Clients page
- [ ] Client list/table displays
- [ ] All columns show correct data (Name, Phone, Email, etc.)
- [ ] Pagination works (if applicable)
- [ ] Search functionality works
- [ ] Filter options work correctly
- [ ] Sort by column headers works

### 3.2 Create New Client
- [ ] Click "Add Client" or "+ New" button
- [ ] Form modal/page opens
- [ ] Fill in all required fields:
  - [ ] Client Name
  - [ ] Phone Number
  - [ ] Email
  - [ ] Company
  - [ ] Address
- [ ] Submit form
- [ ] Success message appears
- [ ] New client appears in list
- [ ] Verify data saved in database

### 3.3 View Client Details
- [ ] Click on a client from the list
- [ ] Client detail page/modal opens
- [ ] All information displays correctly
- [ ] Related projects show (if any)
- [ ] Activity history visible
- [ ] Contact information formatted correctly

### 3.4 Edit Client
- [ ] Open client details
- [ ] Click "Edit" button
- [ ] Modify client information
- [ ] Save changes
- [ ] Changes persist after page reload
- [ ] Verify updated in database

### 3.5 Delete Client
- [ ] Select a test client
- [ ] Click "Delete" button
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Client removed from list
- [ ] Success message shown

**Notes:** _________________________________________________

---

## 4. PROJECTS MODULE

### 4.1 Projects List
- [ ] Navigate to Projects page
- [ ] Projects list displays
- [ ] Project status shows correctly (Active, Completed, etc.)
- [ ] Progress bars/percentages display
- [ ] Client names linked to projects
- [ ] Filter by status works
- [ ] Search projects works

### 4.2 Create New Project
- [ ] Click "Add Project" button
- [ ] Project form opens
- [ ] Fill in details:
  - [ ] Project Name
  - [ ] Client (dropdown)
  - [ ] Description
  - [ ] Start Date
  - [ ] End Date
  - [ ] Budget
  - [ ] Status
- [ ] Submit form
- [ ] Project created successfully
- [ ] Appears in projects list

### 4.3 Project Details
- [ ] Open project details
- [ ] Overview tab shows all info
- [ ] Tasks associated with project visible
- [ ] Budget breakdown displays
- [ ] Timeline/Gantt view works (if available)
- [ ] File attachments section visible

### 4.4 Update Project Status
- [ ] Change project status (In Progress → Completed)
- [ ] Status updates immediately
- [ ] Color coding changes if applicable
- [ ] Notification sent (if configured)

### 4.5 Project Budget Management
- [ ] View budget allocation
- [ ] Add expense to project
- [ ] Budget remaining calculates correctly
- [ ] Budget alerts trigger when threshold reached
- [ ] Export budget report

**Notes:** _________________________________________________

---

## 5. TASKS MODULE

### 5.1 Tasks List
- [ ] Navigate to Tasks page
- [ ] All tasks display
- [ ] Filter by: Pending, Completed, Overdue
- [ ] Sort by: Due Date, Priority, Status
- [ ] Search tasks works
- [ ] Task count badge accurate

### 5.2 Create New Task
- [ ] Click "Add Task" button
- [ ] Task form opens
- [ ] Fill in details:
  - [ ] Task Title
  - [ ] Description
  - [ ] Assigned To (user dropdown)
  - [ ] Due Date
  - [ ] Priority (Low, Medium, High)
  - [ ] Related Project
  - [ ] Tags/Labels
- [ ] Submit form
- [ ] Task created and listed

### 5.3 Task Management
- [ ] Mark task as complete (checkbox)
- [ ] Task moves to completed section
- [ ] Edit task details
- [ ] Change assignee
- [ ] Update due date
- [ ] Add comments to task
- [ ] Delete task (with confirmation)

### 5.4 Task Notifications
- [ ] Overdue tasks highlighted in red
- [ ] Due today tasks have special badge
- [ ] Email notification sent (if configured)
- [ ] In-app notification appears

**Notes:** _________________________________________________

---

## 6. LEADS MODULE

### 6.1 Leads List
- [ ] Navigate to Leads page
- [ ] All leads display in table/cards
- [ ] Lead source shown correctly
- [ ] Lead status visible (New, Contacted, Qualified, etc.)
- [ ] Filter by source works
- [ ] Filter by status works
- [ ] Search leads works

### 6.2 Create New Lead
- [ ] Click "Add Lead" button
- [ ] Lead form opens
- [ ] Fill in details:
  - [ ] Name
  - [ ] Phone
  - [ ] Email
  - [ ] Company
  - [ ] Source (Website, Referral, Cold Call, etc.)
  - [ ] Status
  - [ ] Notes
- [ ] Submit form
- [ ] Lead created successfully

### 6.3 Lead Conversion
- [ ] Open lead details
- [ ] Click "Convert to Client" button
- [ ] Confirmation dialog appears
- [ ] Confirm conversion
- [ ] New client created with lead data
- [ ] Lead status updated to "Converted"
- [ ] Lead removed from active leads list

### 6.4 Lead Assignment
- [ ] Assign lead to sales representative
- [ ] Notification sent to assigned user
- [ ] Lead appears in assigned user's queue
- [ ] Track lead activity history

**Notes:** _________________________________________________

---

## 7. MEETINGS MODULE

### 7.1 Meetings Calendar
- [ ] Navigate to Meetings page
- [ ] Calendar view displays
- [ ] Today's date highlighted
- [ ] Meetings shown on correct dates
- [ ] Switch between Month/Week/Day views
- [ ] Time slots visible

### 7.2 Schedule New Meeting
- [ ] Click on calendar date/time
- [ ] Meeting form opens
- [ ] Fill in details:
  - [ ] Meeting Title
  - [ ] Date & Time
  - [ ] Duration
  - [ ] Participants (select multiple)
  - [ ] Location/Link
  - [ ] Agenda/Notes
  - [ ] Reminder settings
- [ ] Save meeting
- [ ] Meeting appears on calendar
- [ ] Email invitations sent (if configured)

### 7.3 Meeting Management
- [ ] Edit meeting details
- [ ] Reschedule meeting (drag & drop)
- [ ] Cancel meeting
- [ ] Add meeting notes after completion
- [ ] Mark meeting as completed
- [ ] View meeting history

### 7.4 Meeting Notifications
- [ ] Reminder notification 15 min before
- [ ] Email reminder sent
- [ ] In-app notification appears
- [ ] Calendar integration works (if configured)

**Notes:** _________________________________________________

---

## 8. AI AGENT SYSTEM (NEW!)

### 8.1 Agent Chat Interface
- [ ] Locate AI agent chat widget/icon
- [ ] Open chat interface
- [ ] Chat window displays correctly
- [ ] Send test message: "Hello"
- [ ] Agent responds within 5 seconds
- [ ] Response is coherent and relevant

### 8.2 Agent Commands - Read Operations
- [ ] Ask: "Show me all clients"
- [ ] Agent displays client list or count
- [ ] Ask: "Find client [name]"
- [ ] Agent finds and shows client details
- [ ] Ask: "What projects are active?"
- [ ] Agent lists active projects
- [ ] Ask: "Show tasks for today"
- [ ] Agent lists today's tasks

### 8.3 Agent Commands - Write Operations
- [ ] Ask: "Create a meeting for tomorrow at 2pm"
- [ ] Agent confirms meeting details
- [ ] Provide confirmation
- [ ] Meeting created successfully
- [ ] Ask: "Send email to [client]"
- [ ] Agent asks for confirmation
- [ ] Confirm action
- [ ] Email sent (check logs)

### 8.4 Agent Commands - Analytics
- [ ] Ask: "Summarize this week's activity"
- [ ] Agent provides summary
- [ ] Ask: "Show me top 5 clients by revenue"
- [ ] Agent displays ranked list
- [ ] Ask: "What meetings do I have next week?"
- [ ] Agent lists upcoming meetings

### 8.5 Agent Safety & RBAC
- [ ] Test as User role - can't delete clients
- [ ] Test as Manager role - can create proposals
- [ ] Test as Admin role - can access all features
- [ ] Ask agent to perform risky action
- [ ] Agent asks for confirmation
- [ ] Decline action - agent cancels
- [ ] Confirm action - agent proceeds

**Notes:** _________________________________________________

---

## 9. INTEGRATIONS

### 9.1 Retell AI Integration
- [ ] Navigate to Calls/Retell page
- [ ] View list of scheduled calls
- [ ] Create new call request
- [ ] Call queued successfully
- [ ] View call history
- [ ] Listen to call recordings (if available)

### 9.2 Offerteo Integration
- [ ] Navigate to Offerteo/Orders page
- [ ] View incoming orders from Offerteo bot
- [ ] Convert order to lead
- [ ] Convert order to client
- [ ] Update order status

**Notes:** _________________________________________________

---

## 10. RESPONSIVE DESIGN

### 10.1 Mobile View (375px width)
- [ ] Layout adjusts correctly
- [ ] Navigation menu becomes hamburger
- [ ] Tables become scrollable or stacked
- [ ] Forms are usable
- [ ] Buttons are tap-friendly

### 10.2 Tablet View (768px width)
- [ ] Layout uses available space well
- [ ] Sidebar collapses or adjusts
- [ ] Touch interactions work

### 10.3 Desktop View (1920px width)
- [ ] Full layout displays properly
- [ ] No excessive whitespace
- [ ] All elements aligned

**Notes:** _________________________________________________

---

## 11. PERFORMANCE

- [ ] Dashboard loads in < 3 seconds
- [ ] API endpoints respond in < 500ms
- [ ] No console errors
- [ ] Smooth scrolling
- [ ] No memory leaks

**Notes:** _________________________________________________

---

## 12. SECURITY

- [ ] Session expires after timeout
- [ ] Can't access pages without login
- [ ] RBAC enforced correctly
- [ ] Sensitive data encrypted
- [ ] API endpoints require authentication

**Notes:** _________________________________________________

---

## TEST SUMMARY

**Total Tests Performed:** _______ / 150+
**Tests Passed:** _______
**Tests Failed:** _______
**Critical Issues Found:** _______

**Overall System Status:**
- [ ] ✅ Ready for Production
- [ ] ⚠️  Ready with Minor Issues
- [ ] ❌ Not Ready - Critical Issues

**Tester Signature:** ___________________  **Date:** ___________
