import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    shuttleStaff: 0,
    todayAttendance: 0,
    activeBuses: 0,
    activeAnnouncements: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Student management state
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('userID');
  const [emailStatusFilter, setEmailStatusFilter] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    birthday: '',
    address: '',
    email: '',
    role: 'Parent'
  });
  const [studentFormErrors, setStudentFormErrors] = useState({});

  // Teacher management state
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherSortBy, setTeacherSortBy] = useState('userID');
  const [teacherEmailStatusFilter, setTeacherEmailStatusFilter] = useState('');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    birthday: '',
    address: '',
    email: '',
    role: 'Teacher'
  });
  const [teacherFormErrors, setTeacherFormErrors] = useState({});

  // Academic assignment state
  const [academicByUserId, setAcademicByUserId] = useState({}); // { [userID]: { grade, class } }
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignContext, setAssignContext] = useState({ role: '', user: null });
  const [assignForm, setAssignForm] = useState({ grade: '', class: 'A' });

  // Parent details form states
  const [showParentDetailsModal, setShowParentDetailsModal] = useState(false);
  const [parentDetailsForm, setParentDetailsForm] = useState({
    parentName: '',
    contactNumber: '',
    whatsappNumber: ''
  });
  const [parentDetailsErrors, setParentDetailsErrors] = useState({});

  // Shuttle Staff management state
  const [shuttleStaff, setShuttleStaff] = useState([]);
  const [filteredShuttleStaff, setFilteredShuttleStaff] = useState([]);
  const [shuttleSearchTerm, setShuttleSearchTerm] = useState('');
  const [shuttleSortBy, setShuttleSortBy] = useState('userID');
  const [shuttleEmailStatusFilter, setShuttleEmailStatusFilter] = useState('');
  const [showShuttleModal, setShowShuttleModal] = useState(false);
  const [editingShuttle, setEditingShuttle] = useState(null);
  const [shuttleForm, setShuttleForm] = useState({
    fullName: '',
    birthday: '',
    address: '',
    email: '',
    role: 'ShuttleStaff'
  });
  const [shuttleFormErrors, setShuttleFormErrors] = useState({});

  // Admin management state
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminSortBy, setAdminSortBy] = useState('userID');
  const [adminEmailStatusFilter, setAdminEmailStatusFilter] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    birthday: '',
    address: '',
    email: '',
    role: 'Admin'
  });
  const [adminFormErrors, setAdminFormErrors] = useState({});

  // Load user data and dashboard statistics
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await api('/auth/me');
        setUser(userData?.user || userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
        // If authentication fails, clear token and redirect to login
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    const loadDashboardStats = async () => {
      try {
        const stats = await api('/users/stats');
        setDashboardStats({
          totalStudents: stats.parents || 0,
          totalTeachers: stats.teachers || 0,
          shuttleStaff: stats.shuttleStaff || 0,
          todayAttendance: 0, // This would come from attendance API
          activeBuses: 12, // This would come from transport API
          activeAnnouncements: 7 // This would come from announcements API
        });
      } catch (error) {
        console.error('Failed to load dashboard statistics:', error);
      }
    };

    const loadRecentActivity = async () => {
      try {
        if (user?.userID) {
          const response = await api(`/activities/recent/${user.userID}`);
          setRecentActivity(response.activities || []);
        } else {
          // Fallback to empty array if no user
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Failed to load recent activity:', error);
        // Fallback to empty array on error
        setRecentActivity([]);
      }
    };

    loadUserData();
    loadDashboardStats();
    loadRecentActivity();
  }, [navigate]);

  // Check if user is admin, if not redirect to home
  useEffect(() => {
    if (user && user.role && user.role.toLowerCase() !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle tab parameter from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['dashboard', 'students', 'teachers', 'shuttle-staff', 'admins'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuClick = (menuItem) => {
    setActiveTab(menuItem);
    // Close sidebar on mobile
    if (window.innerWidth <= 576) {
      setSidebarOpen(false);
    }
  };

  // Student management functions
  const loadStudents = async () => {
    try {
      // Load users from the API and filter only parents
      const response = await api('/users');
      const users = response.users || [];
      const parentUsers = users.filter(user => user.role === 'Parent');
      setStudents(parentUsers);
      setFilteredStudents(parentUsers);
      // Load academic info for parents
      await loadAcademicAssignments('Parent');
    } catch (error) {
      console.error('Failed to load students:', error);
      // Fallback to empty array if API fails
      setStudents([]);
      setFilteredStudents([]);
    }
  };

  // Teacher management functions
  const loadTeachers = async () => {
    try {
      const response = await api('/users');
      const users = response.users || [];
      const teacherUsers = users.filter(user => user.role === 'Teacher');
      setTeachers(teacherUsers);
      setFilteredTeachers(teacherUsers);
      // Load academic info for teachers
      await loadAcademicAssignments('Teacher');
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setTeachers([]);
      setFilteredTeachers([]);
    }
  };

  // Shuttle Staff management functions
  const loadShuttleStaff = async () => {
    try {
      const response = await api('/users');
      const users = response.users || [];
      const shuttleUsers = users.filter(user => user.role === 'ShuttleStaff');
      setShuttleStaff(shuttleUsers);
      setFilteredShuttleStaff(shuttleUsers);
    } catch (error) {
      console.error('Failed to load shuttle staff:', error);
      setShuttleStaff([]);
      setFilteredShuttleStaff([]);
    }
  };

  // Admin management functions
  const loadAdmins = async () => {
    try {
      const response = await api('/users');
      const users = response.users || [];
      const adminUsers = users.filter(user => user.role === 'Admin');
      setAdmins(adminUsers);
      setFilteredAdmins(adminUsers);
    } catch (error) {
      console.error('Failed to load admins:', error);
      setAdmins([]);
      setFilteredAdmins([]);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];
    
    // Enhanced search filter with better matching
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        // Check all searchable fields
        const fullName = user.fullName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const userID = user.userID?.toLowerCase() || '';
        const address = user.address?.toLowerCase() || '';
        
        // Search in multiple fields
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               userID.includes(searchLower) ||
               address.includes(searchLower);
      });
    }
    
    // Email verification status filter
    if (emailStatusFilter) {
      filtered = filtered.filter(user => {
        if (emailStatusFilter === 'verified') {
          return user.isEmailVerified === true;
        } else if (emailStatusFilter === 'unverified') {
          return user.isEmailVerified === false;
        }
        return true;
      });
    }
    
    // Sort users
    switch(sortBy) {
      case 'name':
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case 'userID':
        filtered.sort((a, b) => a.userID.localeCompare(b.userID));
        break;
    }
    
    setFilteredStudents(filtered);
  };

  // Load academic assignments by role and index by userID
  const loadAcademicAssignments = async (role) => {
    try {
      console.log(`Making API call to /academic?role=${encodeURIComponent(role)}`);
      const res = await api(`/academic?role=${encodeURIComponent(role)}`);
      console.log('API response:', res);
      const list = res.academicRecords || [];
      console.log(`Loading academic assignments for ${role}:`, list);
      setAcademicByUserId(prev => {
        const copy = { ...prev };
        list.forEach(r => {
          // The userID is now an object with userID, fullName, email, role properties
          const uid = r.userID?.userID || r.userID;
          console.log(`Processing academic record for userID: ${uid}, grade: ${r.grade}, class: ${r.class}`);
          if (uid) {
            copy[uid] = { grade: r.grade, class: r.class };
          }
        });
        console.log('Updated academicByUserId:', copy);
        return copy;
      });
    } catch (e) {
      console.error('Failed to load academic assignments:', e);
    }
  };

  const openAssignModal = (user, role) => {
    const current = academicByUserId[user.userID] || { grade: '', class: 'A' };
    setAssignContext({ role, user });
    setAssignForm({ grade: current.grade || '', class: current.class || 'A' });
    setShowAssignModal(true);
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.grade || !assignForm.class) return;
    try {
      // Try to create assignment first, if it fails with "already assigned", then update
      try {
        await api('/academic/assign', {
          method: 'POST',
          body: { userID: assignContext.user.userID, grade: Number(assignForm.grade), class: assignForm.class }
        });
      } catch (createError) {
        // If creation fails because already assigned, try to update instead
        if (createError.message && createError.message.includes('already assigned')) {
          await api(`/academic/${assignContext.user.userID}`, {
            method: 'PUT',
            body: { grade: Number(assignForm.grade), class: assignForm.class }
          });
        } else {
          throw createError; // Re-throw if it's a different error
        }
      }
      // Refresh cache for the role
      await loadAcademicAssignments(assignContext.role);
      
      // If this was a new student assignment, refresh the students list
      if (assignContext.role === 'Parent') {
        await loadStudents();
        // Show parent details form after academic assignment
        setShowAssignModal(false);
        setShowParentDetailsModal(true);
        return;
      }
      
      setShowAssignModal(false);
    } catch (error) {
      console.error('Failed to save academic assignment:', error);
      console.error('Error details:', error.message);
      console.error('Error response:', error);
      alert(`Failed to save assignment: ${error.message || 'Please try again.'}`);
    }
  };

  // Teacher filter and sort function
  const filterAndSortTeachers = () => {
    let filtered = [...teachers];
    
    if (teacherSearchTerm && teacherSearchTerm.trim()) {
      const searchLower = teacherSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fullName = user.fullName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const userID = user.userID?.toLowerCase() || '';
        const address = user.address?.toLowerCase() || '';
        
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               userID.includes(searchLower) ||
               address.includes(searchLower);
      });
    }
    
    if (teacherEmailStatusFilter) {
      filtered = filtered.filter(user => {
        if (teacherEmailStatusFilter === 'verified') {
          return user.isEmailVerified === true;
        } else if (teacherEmailStatusFilter === 'unverified') {
          return user.isEmailVerified === false;
        }
        return true;
      });
    }
    
    switch(teacherSortBy) {
      case 'name':
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case 'userID':
        filtered.sort((a, b) => a.userID.localeCompare(b.userID));
        break;
    }
    
    setFilteredTeachers(filtered);
  };

  // Shuttle Staff filter and sort function
  const filterAndSortShuttleStaff = () => {
    let filtered = [...shuttleStaff];
    
    if (shuttleSearchTerm && shuttleSearchTerm.trim()) {
      const searchLower = shuttleSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fullName = user.fullName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const userID = user.userID?.toLowerCase() || '';
        const address = user.address?.toLowerCase() || '';
        
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               userID.includes(searchLower) ||
               address.includes(searchLower);
      });
    }
    
    if (shuttleEmailStatusFilter) {
      filtered = filtered.filter(user => {
        if (shuttleEmailStatusFilter === 'verified') {
          return user.isEmailVerified === true;
        } else if (shuttleEmailStatusFilter === 'unverified') {
          return user.isEmailVerified === false;
        }
        return true;
      });
    }
    
    switch(shuttleSortBy) {
      case 'name':
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case 'userID':
        filtered.sort((a, b) => a.userID.localeCompare(b.userID));
        break;
    }
    
    setFilteredShuttleStaff(filtered);
  };

  // Admin filter and sort function
  const filterAndSortAdmins = () => {
    let filtered = [...admins];
    
    if (adminSearchTerm && adminSearchTerm.trim()) {
      const searchLower = adminSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fullName = user.fullName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const userID = user.userID?.toLowerCase() || '';
        const address = user.address?.toLowerCase() || '';
        
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               userID.includes(searchLower) ||
               address.includes(searchLower);
      });
    }
    
    if (adminEmailStatusFilter) {
      filtered = filtered.filter(user => {
        if (adminEmailStatusFilter === 'verified') {
          return user.isEmailVerified === true;
        } else if (adminEmailStatusFilter === 'unverified') {
          return user.isEmailVerified === false;
        }
        return true;
      });
    }
    
    switch(adminSortBy) {
      case 'name':
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case 'userID':
        filtered.sort((a, b) => a.userID.localeCompare(b.userID));
        break;
    }
    
    setFilteredAdmins(filtered);
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      fullName: '',
      birthday: '',
      address: '',
      email: '',
      role: 'Parent'
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (user) => {
    setEditingStudent(user);
    setStudentForm({
      fullName: user.fullName,
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user.address,
      email: user.email,
      role: user.role
    });
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api(`/users/${userId}`, { method: 'DELETE' });
        const updatedStudents = students.filter(user => user._id !== userId);
        setStudents(updatedStudents);
        filterAndSortStudents();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  // Calculate grade based on age
  const calculateGradeFromAge = (birthday) => {
    if (!birthday) return null;
    
    const today = new Date();
    const birthDate = new Date(birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    // Grade calculation: (current year - birth year) - 5 = grade
    // This means: age 6 = grade 1, age 7 = grade 2, etc.
    // Ages 6-16 correspond to grades 1-11
    if (actualAge >= 6 && actualAge <= 16) {
      return actualAge - 5; // 6 years old = grade 1, 7 years old = grade 2, etc.
    }
    
    return null; // Invalid age range
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setStudentFormErrors({});
    
    // Validate form
    const birthdayValidation = validateBirthday(studentForm.birthday, studentForm.role);
    if (!birthdayValidation.isValid) {
      setStudentFormErrors({ birthday: birthdayValidation.message });
      return;
    }
    
    // Basic validation
    if (!studentForm.fullName.trim()) {
      setStudentFormErrors({ fullName: 'Full name is required' });
      return;
    }
    if (!studentForm.email.trim()) {
      setStudentFormErrors({ email: 'Email is required' });
      return;
    }
    if (!studentForm.address.trim()) {
      setStudentFormErrors({ address: 'Address is required' });
      return;
    }
    
    try {
      if (editingStudent) {
        // Update existing user - use MongoDB _id for updates
        console.log('Updating student with data:', studentForm);
        const response = await api(`/users/${editingStudent._id}`, {
          method: 'PUT',
          body: studentForm
        });
        console.log('Student updated successfully:', response);
        const updatedStudents = students.map(user => 
          user._id === editingStudent._id 
            ? { ...user, ...studentForm }
            : user
        );
        setStudents(updatedStudents);
        setShowStudentModal(false);
        setStudentFormErrors({});
        filterAndSortStudents();
      } else {
        // Add new user
        console.log('Creating new student with data:', studentForm);
        console.log('Student form validation passed, sending to backend...');
        const response = await api('/users', {
          method: 'POST',
          body: studentForm
        });
        console.log('Student created successfully:', response);
        setStudents([...students, response.user]);
        
        // For new students (parents), calculate grade and show assignment modal
        if (studentForm.role === 'Parent') {
          const calculatedGrade = calculateGradeFromAge(studentForm.birthday);
          console.log('Calculated grade for birthday', studentForm.birthday, ':', calculatedGrade);
          if (calculatedGrade) {
            console.log('Opening assignment modal with grade:', calculatedGrade);
            // Set up the assignment modal with calculated grade
            setAssignContext({ 
              role: 'Parent', 
              user: response.user 
            });
            setAssignForm({ 
              grade: calculatedGrade.toString(), 
              class: 'A' 
            });
            setShowStudentModal(false);
            setShowAssignModal(true);
            setStudentFormErrors({});
            console.log('Modal states set - showStudentModal: false, showAssignModal: true');
            return;
          } else {
            console.log('No grade calculated, closing modal');
          }
        }
        
        setShowStudentModal(false);
        setStudentFormErrors({});
        filterAndSortStudents();
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      console.error('Error details:', error.message);
      console.error('Error response:', error);
      
      if (error.errors && Array.isArray(error.errors)) {
        // Handle backend validation errors
        const errorObj = {};
        error.errors.forEach(err => {
          if (err.includes('birthday') || err.includes('Birthday')) {
            errorObj.birthday = err;
          } else if (err.includes('email') || err.includes('Email')) {
            errorObj.email = err;
          } else if (err.includes('name') || err.includes('Name')) {
            errorObj.fullName = err;
          } else if (err.includes('address') || err.includes('Address')) {
            errorObj.address = err;
          }
        });
        setStudentFormErrors(errorObj);
      } else {
        alert(`Failed to save user: ${error.message || 'Please try again.'}`);
      }
    }
  };

  // Teacher handlers
  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      fullName: '',
      birthday: '',
      address: '',
      email: '',
      role: 'Teacher'
    });
    setShowTeacherModal(true);
  };

  const handleEditTeacher = (user) => {
    setEditingTeacher(user);
    setTeacherForm({
      fullName: user.fullName,
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user.address,
      email: user.email,
      role: user.role
    });
    setShowTeacherModal(true);
  };

  const handleDeleteTeacher = async (userId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await api(`/users/${userId}`, { method: 'DELETE' });
        const updatedTeachers = teachers.filter(user => user._id !== userId);
        setTeachers(updatedTeachers);
        filterAndSortTeachers();
      } catch (error) {
        console.error('Failed to delete teacher:', error);
        alert('Failed to delete teacher. Please try again.');
      }
    }
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTeacher) {
        const response = await api(`/users/${editingTeacher._id}`, {
          method: 'PUT',
          body: teacherForm
        });
        const updatedTeachers = teachers.map(user => 
          user._id === editingTeacher._id 
            ? { ...user, ...teacherForm }
            : user
        );
        setTeachers(updatedTeachers);
      } else {
        const response = await api('/users', {
          method: 'POST',
          body: teacherForm
        });
        setTeachers([...teachers, response.user]);
      }
      
      setShowTeacherModal(false);
      filterAndSortTeachers();
    } catch (error) {
      console.error('Failed to save teacher:', error);
      alert('Failed to save teacher. Please try again.');
    }
  };

  // Shuttle Staff handlers
  const handleAddShuttle = () => {
    setEditingShuttle(null);
    setShuttleForm({
      fullName: '',
      birthday: '',
      address: '',
      email: '',
      role: 'ShuttleStaff'
    });
    setShowShuttleModal(true);
  };

  const handleEditShuttle = (user) => {
    setEditingShuttle(user);
    setShuttleForm({
      fullName: user.fullName,
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user.address,
      email: user.email,
      role: user.role
    });
    setShowShuttleModal(true);
  };

  const handleDeleteShuttle = async (userId) => {
    if (window.confirm('Are you sure you want to delete this shuttle staff member?')) {
      try {
        await api(`/users/${userId}`, { method: 'DELETE' });
        const updatedShuttleStaff = shuttleStaff.filter(user => user._id !== userId);
        setShuttleStaff(updatedShuttleStaff);
        filterAndSortShuttleStaff();
      } catch (error) {
        console.error('Failed to delete shuttle staff:', error);
        alert('Failed to delete shuttle staff. Please try again.');
      }
    }
  };

  const handleSaveShuttle = async (e) => {
    e.preventDefault();
    
    try {
      if (editingShuttle) {
        const response = await api(`/users/${editingShuttle._id}`, {
          method: 'PUT',
          body: shuttleForm
        });
        const updatedShuttleStaff = shuttleStaff.map(user => 
          user._id === editingShuttle._id 
            ? { ...user, ...shuttleForm }
            : user
        );
        setShuttleStaff(updatedShuttleStaff);
      } else {
        const response = await api('/users', {
          method: 'POST',
          body: shuttleForm
        });
        setShuttleStaff([...shuttleStaff, response.user]);
      }
      
      setShowShuttleModal(false);
      filterAndSortShuttleStaff();
    } catch (error) {
      console.error('Failed to save shuttle staff:', error);
      alert('Failed to save shuttle staff. Please try again.');
    }
  };

  // Admin handlers
  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setAdminForm({
      fullName: '',
      birthday: '',
      address: '',
      email: '',
      role: 'Admin'
    });
    setShowAdminModal(true);
  };

  const handleEditAdmin = (user) => {
    setEditingAdmin(user);
    setAdminForm({
      fullName: user.fullName,
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user.address,
      email: user.email,
      role: user.role
    });
    setShowAdminModal(true);
  };

  const handleDeleteAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await api(`/users/${userId}`, { method: 'DELETE' });
        const updatedAdmins = admins.filter(user => user._id !== userId);
        setAdmins(updatedAdmins);
        filterAndSortAdmins();
      } catch (error) {
        console.error('Failed to delete admin:', error);
        alert('Failed to delete admin. Please try again.');
      }
    }
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAdmin) {
        const response = await api(`/users/${editingAdmin._id}`, {
          method: 'PUT',
          body: adminForm
        });
        const updatedAdmins = admins.map(user => 
          user._id === editingAdmin._id 
            ? { ...user, ...adminForm }
            : user
        );
        setAdmins(updatedAdmins);
      } else {
        const response = await api('/users', {
          method: 'POST',
          body: adminForm
        });
        setAdmins([...admins, response.user]);
      }
      
      setShowAdminModal(false);
      filterAndSortAdmins();
    } catch (error) {
      console.error('Failed to save admin:', error);
      alert('Failed to save admin. Please try again.');
    }
  };

  // Load data when tabs are active
  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
      // Also load academic assignments for students
      loadAcademicAssignments('Parent');
    } else if (activeTab === 'teachers') {
      loadTeachers();
      // Also load academic assignments for teachers
      loadAcademicAssignments('Teacher');
    } else if (activeTab === 'assignments') {
      loadAcademicAssignments('Parent');
      loadAcademicAssignments('Teacher');
    } else if (activeTab === 'shuttle-staff') {
      loadShuttleStaff();
    } else if (activeTab === 'admins') {
      loadAdmins();
    } else if (activeTab === 'dashboard') {
      // Log dashboard access
      logDashboardAccess();
    }
  }, [activeTab]);

  // Load academic data on component mount
  useEffect(() => {
    loadAcademicAssignments('Parent');
    loadAcademicAssignments('Teacher');
  }, []);

  // Log dashboard access
  const logDashboardAccess = async () => {
    try {
      await api('/activities/log', {
        method: 'POST',
        body: {
          action: 'dashboard_viewed',
          targetType: 'dashboard',
          targetId: null,
          targetName: 'Admin Dashboard',
          description: 'Accessed admin dashboard',
          details: { section: 'dashboard' }
        }
      });
    } catch (error) {
      console.error('Failed to log dashboard access:', error);
    }
  };

  // Filter and sort when filters change
  useEffect(() => {
    filterAndSortStudents();
  }, [searchTerm, sortBy, emailStatusFilter, students]);

  useEffect(() => {
    filterAndSortTeachers();
  }, [teacherSearchTerm, teacherSortBy, teacherEmailStatusFilter, teachers]);

  useEffect(() => {
    filterAndSortShuttleStaff();
  }, [shuttleSearchTerm, shuttleSortBy, shuttleEmailStatusFilter, shuttleStaff]);

  useEffect(() => {
    filterAndSortAdmins();
  }, [adminSearchTerm, adminSortBy, adminEmailStatusFilter, admins]);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed - showStudentModal:', showStudentModal, 'showAssignModal:', showAssignModal);
    if (showAssignModal) {
      console.log('Assignment modal context:', assignContext);
      console.log('Assignment form:', assignForm);
    }
  }, [showStudentModal, showAssignModal, assignContext, assignForm]);

  // Test function to manually load academic data
  const testLoadAcademic = async () => {
    console.log('Testing academic data load...');
    console.log('Current academicByUserId before load:', academicByUserId);
    await loadAcademicAssignments('Parent');
    console.log('Current academicByUserId after load:', academicByUserId);
    
    // Also test the API directly
    try {
      const res = await api('/academic?role=Parent');
      console.log('Direct API call result:', res);
    } catch (error) {
      console.error('Direct API call failed:', error);
    }
  };

  // Parent details form handlers
  const handleParentDetailsChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setParentDetailsForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setParentDetailsForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // Clear error when user starts typing
    if (parentDetailsErrors[field]) {
      setParentDetailsErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSaveParentDetails = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!parentDetailsForm.parentName.trim()) errors.parentName = 'Parent name is required';
    if (!parentDetailsForm.contactNumber.trim()) errors.contactNumber = 'Contact number is required';
    if (!parentDetailsForm.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp number is required';

    if (Object.keys(errors).length > 0) {
      setParentDetailsErrors(errors);
      return;
    }

    try {
      // Update the parent user with additional details
      await api(`/users/${assignContext.user.userID}`, {
        method: 'PUT',
        body: parentDetailsForm
      });

      setShowParentDetailsModal(false);
      setParentDetailsForm({
        parentName: '',
        contactNumber: '',
        whatsappNumber: ''
      });
      setParentDetailsErrors({});
      
      // Refresh students list
      await loadStudents();
      alert('Parent details saved successfully!');
    } catch (error) {
      console.error('Failed to save parent details:', error);
      alert('Failed to save parent details. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Validation functions
  const validateBirthday = (birthday, role) => {
    if (!birthday) return { isValid: false, message: 'Birthday is required' };
    
    const today = new Date();
    const birthDate = new Date(birthday);
    
    // Check if birthday is in the future
    if (birthDate > today) {
      return { isValid: false, message: 'Birthday cannot be in the future' };
    }
    
    // Check age limits for Parent role (students should be 6-16 years old for grades 1-11)
    if (role === 'Parent') {
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 6) {
        return { isValid: false, message: 'Student must be at least 6 years old' };
      }
      if (actualAge > 16) {
        return { isValid: false, message: 'Student cannot be older than 16 years' };
      }
    }
    
    return { isValid: true, message: '' };
  };

  // Enhanced search handler with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Real-time search - no need for manual trigger
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    filterAndSortStudents();
  };

  const clearSearch = () => {
    setSearchTerm('');
    filterAndSortStudents();
  };

  const handleRowClick = async (user) => {
    // Log activity for viewing user profile
    try {
      await api('/activities/log', {
        method: 'POST',
        body: {
          action: 'user_viewed',
          targetType: 'user',
          targetId: user._id,
          targetName: user.fullName,
          description: `Viewed ${user.role} profile: ${user.fullName} (${user.userID})`,
          details: { role: user.role, email: user.email }
        }
      });
    } catch (error) {
      console.error('Failed to log user view activity:', error);
      // Continue with navigation even if logging fails
    }
    
    // Navigate to profile page with user ID and current tab as parameters
    navigate(`/profile/${user._id}?from=${activeTab}`);
  };

  // Function to highlight search terms in text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return <mark key={index} className="search-highlight">{part}</mark>;
      }
      return part;
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Menu Toggle for Mobile */}
      <button className="menu-toggle" onClick={handleMenuToggle}>
        <i className="fas fa-bars"></i>
      </button>
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <i className="fas fa-graduation-cap fa-2x"></i>
          <h2>Smart Alert</h2>
          <p>Admin Dashboard</p>
        </div>
        
        <div className="sidebar-menu">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleMenuClick('dashboard')}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </div>
          <div className={`menu-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => handleMenuClick('students')}>
            <i className="fas fa-user-graduate"></i>
            <span>Students</span>
          </div>
          <div className={`menu-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => handleMenuClick('teachers')}>
            <i className="fas fa-chalkboard-teacher"></i>
            <span>Teachers</span>
          </div>
          <div className={`menu-item ${activeTab === 'shuttle-staff' ? 'active' : ''}`} onClick={() => handleMenuClick('shuttle-staff')}>
            <i className="fas fa-bus-alt"></i>
            <span>Shuttle Staff</span>
          </div>
          <div className={`menu-item ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => handleMenuClick('admins')}>
            <i className="fas fa-user-shield"></i>
            <span>Admins</span>
          </div>
          <div className={`menu-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => handleMenuClick('assignments')}>
            <i className="fas fa-tasks"></i>
            <span>Assignments</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('attendance')}>
            <i className="fas fa-clipboard-check"></i>
            <span>Attendance</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('transportation')}>
            <i className="fas fa-bus"></i>
            <span>Transportation</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('performance')}>
            <i className="fas fa-chart-line"></i>
            <span>Performance</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('announcements')}>
            <i className="fas fa-bullhorn"></i>
            <span>Announcements</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('communication')}>
            <i className="fas fa-comments"></i>
            <span>Communication</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('settings')}>
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </div>
          <div className="menu-item" onClick={handleBackToHome}>
            <i className="fas fa-home"></i>
            <span>Back to Home</span>
          </div>
          <div className="menu-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search..." />
          </div>
          
          <div className="user-info">
            <div className="notifications">
              <i className="fas fa-bell fa-lg"></i>
              <span className="notification-badge">5</span>
            </div>
            
            <div 
              className="user-info-clickable"
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
              onClick={async () => {
                // Log profile view activity
                try {
                  await api('/activities/log', {
                    method: 'POST',
                    body: {
                      action: 'profile_viewed',
                      targetType: 'profile',
                      targetId: user?.userID,
                      targetName: user?.name || 'Admin User',
                      description: 'Viewed own profile',
                      details: { role: user?.role }
                    }
                  });
                } catch (error) {
                  console.error('Failed to log profile view activity:', error);
                }
                navigate('/profile');
              }}
              title="View Profile"
            >
              <div className="user-avatar">
                <i className="fas fa-user fa-lg"></i>
              </div>
              <div className="user-details">
                <h4>{user?.name || 'Admin User'}</h4>
                <p>Administrator</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Dashboard Cards */}
            <div className="dashboard-cards">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>{dashboardStats.totalStudents.toLocaleString()}</h3>
                    <p>Total Students</p>
                  </div>
                  <div className="card-icon students">
                    <i className="fas fa-user-graduate"></i>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>{dashboardStats.totalTeachers}</h3>
                    <p>Total Teachers</p>
                  </div>
                  <div className="card-icon teachers">
                    <i className="fas fa-chalkboard-teacher"></i>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>{dashboardStats.shuttleStaff}</h3>
                    <p>Shuttle Staff</p>
                  </div>
                  <div className="card-icon shuttle-staff">
                    <i className="fas fa-bus-alt"></i>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>0%</h3>
                    <p>Today's Attendance</p>
                  </div>
                  <div className="card-icon attendance">
                    <i className="fas fa-clipboard-check"></i>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>0</h3>
                    <p>Active Buses</p>
                  </div>
                  <div className="card-icon transport">
                    <i className="fas fa-bus"></i>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>0</h3>
                    <p>Active Announcements</p>
                  </div>
                  <div className="card-icon announcements">
                    <i className="fas fa-bullhorn"></i>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts Section */}
            <div className="charts">
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Student Performance Overview</h3>
                  <select>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <p><i className="fas fa-chart-bar fa-3x" style={{ color: '#00bfa5', marginBottom: '10px' }}></i><br />Chart visualization would appear here with real data</p>
                </div>
              </div>
              
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Attendance Statistics</h3>
                  <select>
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>This Year</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <p><i className="fas fa-chart-pie fa-3x" style={{ color: '#00bfa5', marginBottom: '10px' }}></i><br />Attendance Chart Visualization</p>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <i className={`fas fa-${activity.type}`}></i>
                    </div>
                    <div className="activity-content">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Students Management Content */}
        {activeTab === 'students' && (
          <>
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">Student Management</h1>
              <div className="header-buttons">
                <button className="btn btn-info" onClick={testLoadAcademic}>
                  <i className="fas fa-test-tube"></i>
                  <span>Test Academic Data</span>
                </button>
                <button className="btn btn-primary" onClick={handleAddStudent}>
                  <i className="fas fa-plus"></i>
                  <span>Add New Student</span>
                </button>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="controls-section">
              <div className="search-bar-large">
                <input 
                  type="text" 
                  placeholder="Search students by name, userID, email, or address..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                />
                <div className="search-buttons">
                  {searchTerm && (
                    <button 
                      type="button" 
                      onClick={clearSearch}
                      className="clear-search-btn"
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={handleSearchSubmit}
                    title="Search"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div className="filters-row">
                <div className="filter-group">
                  <label htmlFor="emailStatusFilter">Email Status</label>
                  <select 
                    id="emailStatusFilter" 
                    value={emailStatusFilter}
                    onChange={(e) => setEmailStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="sortBy">Sort By</label>
                  <select 
                    id="sortBy" 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="userID">User ID</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Search Results Info */}
            {(searchTerm || emailStatusFilter) && (
              <div className="search-results-info">
                <span>
                  {filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''} found
                  {searchTerm && ` for "${highlightText(searchTerm, searchTerm)}"`}
                  {emailStatusFilter && ` (${emailStatusFilter} emails)`}
                </span>
                <button onClick={() => { setSearchTerm(''); setEmailStatusFilter(''); }} className="clear-all-btn">
                  Clear filters
                </button>
              </div>
            )}
            
            {/* Users Table */}
            <div className="students-table-container">
              <table className="students-table">
                 <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Email Status</th>
                    <th>Grade</th>
                    <th>Class</th>
                    <th>Address</th>
                    <th>Birthday</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                 </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                        No Students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((user, index) => {
                      const age = user.birthday ? Math.floor((new Date() - new Date(user.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
                      const birthday = user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A';
                      return (
                        <tr key={user._id} className="clickable-row" onClick={() => handleRowClick(user)}>
                          <td className="row-number">{index + 1}</td>
                          <td>
                            <div className="student-info">
                              <div>
                                <div className="student-name">
                                  {searchTerm ? highlightText(user.fullName, searchTerm) : user.fullName}
                                </div>
                                <div className="student-id">
                                  ID: {searchTerm ? highlightText(user.userID, searchTerm) : user.userID}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{searchTerm ? highlightText(user.email, searchTerm) : user.email}</td>
                          <td>
                            <span className={`email-status ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                              <i className={`fas ${user.isEmailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>{academicByUserId[user.userID]?.grade ?? '-'}</td>
                          <td>{academicByUserId[user.userID]?.class ?? '-'}</td>
                          <td>{searchTerm ? highlightText(user.address, searchTerm) : user.address}</td>
                          <td>{birthday}</td>
                          <td>{age} years old</td>
                          <td>
                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="action-btn edit-btn" 
                                onClick={() => handleEditStudent(user)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                className="action-btn"
                                onClick={() => openAssignModal(user, 'Parent')}
                              >
                                <i className="fas fa-tasks"></i> {academicByUserId[user.userID] ? 'Edit Assignment' : 'Assign'}
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                onClick={() => handleDeleteStudent(user._id)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Teachers Management Content */}
        {activeTab === 'teachers' && (
          <>
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">Teacher Management</h1>
              <button className="btn btn-primary" onClick={handleAddTeacher}>
                <i className="fas fa-plus"></i>
                <span>Add New Teacher</span>
              </button>
            </div>
            
            {/* Controls Section */}
            <div className="controls-section">
              <div className="search-bar-large">
                <input 
                  type="text" 
                  placeholder="Search teachers by name, userID, email, or address..." 
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                />
                <div className="search-buttons">
                  {teacherSearchTerm && (
                    <button 
                      type="button" 
                      onClick={() => setTeacherSearchTerm('')}
                      className="clear-search-btn"
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => filterAndSortTeachers()}
                    title="Search"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div className="filters-row">
                <div className="filter-group">
                  <label htmlFor="teacherEmailStatusFilter">Email Status</label>
                  <select 
                    id="teacherEmailStatusFilter" 
                    value={teacherEmailStatusFilter}
                    onChange={(e) => setTeacherEmailStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="teacherSortBy">Sort By</label>
                  <select 
                    id="teacherSortBy" 
                    value={teacherSortBy}
                    onChange={(e) => setTeacherSortBy(e.target.value)}
                  >
                    <option value="userID">User ID</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Search Results Info */}
            {(teacherSearchTerm || teacherEmailStatusFilter) && (
              <div className="search-results-info">
                <span>
                  {filteredTeachers.length} result{filteredTeachers.length !== 1 ? 's' : ''} found
                  {teacherSearchTerm && ` for "${teacherSearchTerm}"`}
                  {teacherEmailStatusFilter && ` (${teacherEmailStatusFilter} emails)`}
                </span>
                <button onClick={() => { setTeacherSearchTerm(''); setTeacherEmailStatusFilter(''); }} className="clear-all-btn">
                  Clear filters
                </button>
              </div>
            )}
            
            {/* Teachers Table */}
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Teacher</th>
                    <th>Email</th>
                    <th>Email Status</th>
                    <th>Grade</th>
                    <th>Class</th>
                    <th>Address</th>
                    <th>Birthday</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                        No teachers found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((user, index) => {
                      const age = user.birthday ? Math.floor((new Date() - new Date(user.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
                      const birthday = user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A';
                      return (
                        <tr key={user._id} className="clickable-row" onClick={() => handleRowClick(user)}>
                          <td className="row-number">{index + 1}</td>
                          <td>
                            <div className="student-info">
                              <div>
                                <div className="student-name">
                                  {teacherSearchTerm ? highlightText(user.fullName, teacherSearchTerm) : user.fullName}
                                </div>
                                <div className="student-id">
                                  ID: {teacherSearchTerm ? highlightText(user.userID, teacherSearchTerm) : user.userID}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{teacherSearchTerm ? highlightText(user.email, teacherSearchTerm) : user.email}</td>
                          <td>
                            <span className={`email-status ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                              <i className={`fas ${user.isEmailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>{academicByUserId[user.userID]?.grade ?? '-'}</td>
                          <td>{academicByUserId[user.userID]?.class ?? '-'}</td>
                          <td>{teacherSearchTerm ? highlightText(user.address, teacherSearchTerm) : user.address}</td>
                          <td>{birthday}</td>
                          <td>{age} years old</td>
                          <td>
                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="action-btn edit-btn" 
                                onClick={() => handleEditTeacher(user)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                className="action-btn"
                                onClick={() => openAssignModal(user, 'Teacher')}
                              >
                                <i className="fas fa-tasks"></i> {academicByUserId[user.userID] ? 'Edit Assignment' : 'Assign'}
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                onClick={() => handleDeleteTeacher(user._id)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Shuttle Staff Management Content */}
        {activeTab === 'shuttle-staff' && (
          <>
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">Shuttle Staff Management</h1>
              <button className="btn btn-primary" onClick={handleAddShuttle}>
                <i className="fas fa-plus"></i>
                <span>Add New Staff</span>
              </button>
            </div>
            
            {/* Controls Section */}
            <div className="controls-section">
              <div className="search-bar-large">
                <input 
                  type="text" 
                  placeholder="Search shuttle staff by name, userID, email, or address..." 
                  value={shuttleSearchTerm}
                  onChange={(e) => setShuttleSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                />
                <div className="search-buttons">
                  {shuttleSearchTerm && (
                    <button 
                      type="button" 
                      onClick={() => setShuttleSearchTerm('')}
                      className="clear-search-btn"
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => filterAndSortShuttleStaff()}
                    title="Search"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div className="filters-row">
                <div className="filter-group">
                  <label htmlFor="shuttleEmailStatusFilter">Email Status</label>
                  <select 
                    id="shuttleEmailStatusFilter" 
                    value={shuttleEmailStatusFilter}
                    onChange={(e) => setShuttleEmailStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="shuttleSortBy">Sort By</label>
                  <select 
                    id="shuttleSortBy" 
                    value={shuttleSortBy}
                    onChange={(e) => setShuttleSortBy(e.target.value)}
                  >
                    <option value="userID">User ID</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Search Results Info */}
            {(shuttleSearchTerm || shuttleEmailStatusFilter) && (
              <div className="search-results-info">
                <span>
                  {filteredShuttleStaff.length} result{filteredShuttleStaff.length !== 1 ? 's' : ''} found
                  {shuttleSearchTerm && ` for "${shuttleSearchTerm}"`}
                  {shuttleEmailStatusFilter && ` (${shuttleEmailStatusFilter} emails)`}
                </span>
                <button onClick={() => { setShuttleSearchTerm(''); setShuttleEmailStatusFilter(''); }} className="clear-all-btn">
                  Clear filters
                </button>
              </div>
            )}
            
            {/* Shuttle Staff Table */}
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Staff Member</th>
                    <th>Email</th>
                    <th>Email Status</th>
                    <th>Address</th>
                    <th>Birthday</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShuttleStaff.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                        No shuttle staff found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShuttleStaff.map((user, index) => {
                      const age = user.birthday ? Math.floor((new Date() - new Date(user.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
                      const birthday = user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A';
                      return (
                        <tr key={user._id} className="clickable-row" onClick={() => handleRowClick(user)}>
                          <td className="row-number">{index + 1}</td>
                          <td>
                            <div className="student-info">
                              <div>
                                <div className="student-name">
                                  {shuttleSearchTerm ? highlightText(user.fullName, shuttleSearchTerm) : user.fullName}
                                </div>
                                <div className="student-id">
                                  ID: {shuttleSearchTerm ? highlightText(user.userID, shuttleSearchTerm) : user.userID}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{shuttleSearchTerm ? highlightText(user.email, shuttleSearchTerm) : user.email}</td>
                          <td>
                            <span className={`email-status ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                              <i className={`fas ${user.isEmailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>{shuttleSearchTerm ? highlightText(user.address, shuttleSearchTerm) : user.address}</td>
                          <td>{birthday}</td>
                          <td>{age} years old</td>
                          <td>
                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="action-btn edit-btn" 
                                onClick={() => handleEditShuttle(user)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                onClick={() => handleDeleteShuttle(user._id)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Admins Management Content */}
        {activeTab === 'admins' && (
          <>
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">Admin Management</h1>
              <button className="btn btn-primary" onClick={handleAddAdmin}>
                <i className="fas fa-plus"></i>
                <span>Add New Admin</span>
              </button>
            </div>
            
            {/* Controls Section */}
            <div className="controls-section">
              <div className="search-bar-large">
                <input 
                  type="text" 
                  placeholder="Search admins by name, userID, email, or address..." 
                  value={adminSearchTerm}
                  onChange={(e) => setAdminSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                />
                <div className="search-buttons">
                  {adminSearchTerm && (
                    <button 
                      type="button" 
                      onClick={() => setAdminSearchTerm('')}
                      className="clear-search-btn"
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => filterAndSortAdmins()}
                    title="Search"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div className="filters-row">
                <div className="filter-group">
                  <label htmlFor="adminEmailStatusFilter">Email Status</label>
                  <select 
                    id="adminEmailStatusFilter" 
                    value={adminEmailStatusFilter}
                    onChange={(e) => setAdminEmailStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="adminSortBy">Sort By</label>
                  <select 
                    id="adminSortBy" 
                    value={adminSortBy}
                    onChange={(e) => setAdminSortBy(e.target.value)}
                  >
                    <option value="userID">User ID</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Search Results Info */}
            {(adminSearchTerm || adminEmailStatusFilter) && (
              <div className="search-results-info">
                <span>
                  {filteredAdmins.length} result{filteredAdmins.length !== 1 ? 's' : ''} found
                  {adminSearchTerm && ` for "${adminSearchTerm}"`}
                  {adminEmailStatusFilter && ` (${adminEmailStatusFilter} emails)`}
                </span>
                <button onClick={() => { setAdminSearchTerm(''); setAdminEmailStatusFilter(''); }} className="clear-all-btn">
                  Clear filters
                </button>
              </div>
            )}
            
            {/* Admins Table */}
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Admin</th>
                    <th>Email</th>
                    <th>Email Status</th>
                    <th>Address</th>
                    <th>Birthday</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                        No admins found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((user, index) => {
                      const age = user.birthday ? Math.floor((new Date() - new Date(user.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
                      const birthday = user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A';
                      return (
                        <tr key={user._id} className="clickable-row" onClick={() => handleRowClick(user)}>
                          <td className="row-number">{index + 1}</td>
                          <td>
                            <div className="student-info">
                              <div>
                                <div className="student-name">
                                  {adminSearchTerm ? highlightText(user.fullName, adminSearchTerm) : user.fullName}
                                </div>
                                <div className="student-id">
                                  ID: {adminSearchTerm ? highlightText(user.userID, adminSearchTerm) : user.userID}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{adminSearchTerm ? highlightText(user.email, adminSearchTerm) : user.email}</td>
                          <td>
                            <span className={`email-status ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                              <i className={`fas ${user.isEmailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>{adminSearchTerm ? highlightText(user.address, adminSearchTerm) : user.address}</td>
                          <td>{birthday}</td>
                          <td>{age} years old</td>
                          <td>
                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="action-btn edit-btn" 
                                onClick={() => handleEditAdmin(user)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                onClick={() => handleDeleteAdmin(user._id)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      
      {/* Add/Edit Parent Modal */}
      {showStudentModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button 
                className="close-modal" 
                onClick={() => setShowStudentModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  value={studentForm.fullName}
                  onChange={(e) => {
                    setStudentForm({...studentForm, fullName: e.target.value});
                    if (studentFormErrors.fullName) {
                      setStudentFormErrors({...studentFormErrors, fullName: ''});
                    }
                  }}
                  required 
                  placeholder="e.g., John Doe"
                  className={studentFormErrors.fullName ? 'error' : ''}
                />
                {studentFormErrors.fullName && (
                  <div className="error-message">{studentFormErrors.fullName}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  value={studentForm.email}
                  onChange={(e) => {
                    setStudentForm({...studentForm, email: e.target.value});
                    if (studentFormErrors.email) {
                      setStudentFormErrors({...studentFormErrors, email: ''});
                    }
                  }}
                  required 
                  placeholder="e.g., john.doe@school.edu"
                  className={studentFormErrors.email ? 'error' : ''}
                />
                {studentFormErrors.email && (
                  <div className="error-message">{studentFormErrors.email}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="birthday">Birthday</label>
                <input 
                  type="date" 
                  id="birthday" 
                  value={studentForm.birthday}
                  onChange={(e) => {
                    setStudentForm({...studentForm, birthday: e.target.value});
                    if (studentFormErrors.birthday) {
                      setStudentFormErrors({...studentFormErrors, birthday: ''});
                    }
                  }}
                  required 
                  max={new Date().toISOString().split('T')[0]}
                  className={studentFormErrors.birthday ? 'error' : ''}
                />
                {studentFormErrors.birthday && (
                  <div className="error-message">{studentFormErrors.birthday}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  value={studentForm.address}
                  onChange={(e) => {
                    setStudentForm({...studentForm, address: e.target.value});
                    if (studentFormErrors.address) {
                      setStudentFormErrors({...studentFormErrors, address: ''});
                    }
                  }}
                  required 
                  placeholder="e.g., 123 Main St, City, State"
                  className={studentFormErrors.address ? 'error' : ''}
                />
                {studentFormErrors.address && (
                  <div className="error-message">{studentFormErrors.address}</div>
                )}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel" 
                  onClick={() => setShowStudentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn btn-submit">
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {showTeacherModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <button 
                className="close-modal" 
                onClick={() => setShowTeacherModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveTeacher}>
              <div className="form-group">
                <label htmlFor="teacherFullName">Full Name *</label>
                <input 
                  type="text" 
                  id="teacherFullName"
                  value={teacherForm.fullName}
                  onChange={(e) => setTeacherForm({...teacherForm, fullName: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="teacherEmail">Email *</label>
                <input 
                  type="email" 
                  id="teacherEmail"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="teacherBirthday">Birthday</label>
                <input 
                  type="date" 
                  id="teacherBirthday"
                  value={teacherForm.birthday}
                  onChange={(e) => setTeacherForm({...teacherForm, birthday: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="teacherAddress">Address</label>
                <input 
                  type="text" 
                  id="teacherAddress"
                  value={teacherForm.address}
                  onChange={(e) => setTeacherForm({...teacherForm, address: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel" 
                  onClick={() => setShowTeacherModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Shuttle Staff Modal */}
      {showShuttleModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingShuttle ? 'Edit Shuttle Staff' : 'Add New Shuttle Staff'}
              </h2>
              <button 
                className="close-modal" 
                onClick={() => setShowShuttleModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveShuttle}>
              <div className="form-group">
                <label htmlFor="shuttleFullName">Full Name *</label>
                <input 
                  type="text" 
                  id="shuttleFullName"
                  value={shuttleForm.fullName}
                  onChange={(e) => setShuttleForm({...shuttleForm, fullName: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="shuttleEmail">Email *</label>
                <input 
                  type="email" 
                  id="shuttleEmail"
                  value={shuttleForm.email}
                  onChange={(e) => setShuttleForm({...shuttleForm, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="shuttleBirthday">Birthday</label>
                <input 
                  type="date" 
                  id="shuttleBirthday"
                  value={shuttleForm.birthday}
                  onChange={(e) => setShuttleForm({...shuttleForm, birthday: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="shuttleAddress">Address</label>
                <input 
                  type="text" 
                  id="shuttleAddress"
                  value={shuttleForm.address}
                  onChange={(e) => setShuttleForm({...shuttleForm, address: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel" 
                  onClick={() => setShowShuttleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  {editingShuttle ? 'Update Staff' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Admin Modal */}
      {showAdminModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
              </h2>
              <button 
                className="close-modal" 
                onClick={() => setShowAdminModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveAdmin}>
              <div className="form-group">
                <label htmlFor="adminFullName">Full Name *</label>
                <input 
                  type="text" 
                  id="adminFullName"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({...adminForm, fullName: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="adminEmail">Email *</label>
                <input 
                  type="email" 
                  id="adminEmail"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="adminBirthday">Birthday</label>
                <input 
                  type="date" 
                  id="adminBirthday"
                  value={adminForm.birthday}
                  onChange={(e) => setAdminForm({...adminForm, birthday: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="adminAddress">Address</label>
                <input 
                  type="text" 
                  id="adminAddress"
                  value={adminForm.address}
                  onChange={(e) => setAdminForm({...adminForm, address: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel" 
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  {editingAdmin ? 'Update Admin' : 'Save Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Grade/Class Modal */}
      {showAssignModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {academicByUserId[assignContext.user?.userID] ? 'Edit Assignment' : 'Assign Grade & Class'}
              </h2>
              <button 
                className="close-modal" 
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={saveAssignment}>
              <div className="form-group">
                <label>User</label>
                <input type="text" value={`${assignContext.user?.fullName || ''} (${assignContext.user?.userID || ''})`} readOnly />
              </div>
              
              {/* Show auto-calculated grade message for new students */}
              {!academicByUserId[assignContext.user?.userID] && assignContext.role === 'Parent' && (
                <div className="form-group" style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  marginBottom: '15px',
                  border: '1px solid #4caf50'
                }}>
                  <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                    Grade {assignForm.grade} has been automatically calculated based on the student's age. 
                    You can modify it if needed and select the class.
                  </p>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="assignGrade">Grade</label>
                <select
                  id="assignGrade"
                  value={assignForm.grade}
                  onChange={(e) => setAssignForm({ ...assignForm, grade: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Grade</option>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="assignClass">Class</label>
                <select
                  id="assignClass"
                  value={assignForm.class}
                  onChange={(e) => setAssignForm({ ...assignForm, class: e.target.value })}
                  required
                >
                  {['A','B','C'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel" 
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn btn-submit">
                  {academicByUserId[assignContext.user?.userID] ? 'Update Assignment' : 'Assign Grade & Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Details Modal */}
      {showParentDetailsModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Parent Details</h2>
              <button 
                className="close-modal" 
                onClick={() => setShowParentDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSaveParentDetails}>
              <div className="form-group">
                <label htmlFor="parentName">Parent Name *</label>
                <input
                  type="text"
                  id="parentName"
                  value={parentDetailsForm.parentName}
                  onChange={(e) => handleParentDetailsChange('parentName', e.target.value)}
                  className={parentDetailsErrors.parentName ? 'error' : ''}
                  placeholder="Enter parent name"
                />
                {parentDetailsErrors.parentName && (
                  <span className="error-message">{parentDetailsErrors.parentName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number *</label>
                <input
                  type="tel"
                  id="contactNumber"
                  value={parentDetailsForm.contactNumber}
                  onChange={(e) => handleParentDetailsChange('contactNumber', e.target.value)}
                  className={parentDetailsErrors.contactNumber ? 'error' : ''}
                  placeholder="Enter contact number"
                />
                {parentDetailsErrors.contactNumber && (
                  <span className="error-message">{parentDetailsErrors.contactNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="whatsappNumber">WhatsApp Number *</label>
                <input
                  type="tel"
                  id="whatsappNumber"
                  value={parentDetailsForm.whatsappNumber}
                  onChange={(e) => handleParentDetailsChange('whatsappNumber', e.target.value)}
                  className={parentDetailsErrors.whatsappNumber ? 'error' : ''}
                  placeholder="Enter WhatsApp number"
                />
                {parentDetailsErrors.whatsappNumber && (
                  <span className="error-message">{parentDetailsErrors.whatsappNumber}</span>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel"
                  onClick={() => setShowParentDetailsModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  Save Parent Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
