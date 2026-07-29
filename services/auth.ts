import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://frosh-app-backend.onrender.com/api';
console.log('🌐 auth.ts loaded with API_URL:', API_URL);

// ============ LOGIN FUNCTION ============
export const login = async (email: string, password: string) => {
  try {
    console.log('🔑 Trying login for:', email);
    
    // FIRST: Try student login
    try {
      const studentResponse = await axios.post(`${API_URL}/admin/student-login`, {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      console.log('Student login response:', studentResponse.data);

      if (studentResponse.data.success) {
        await AsyncStorage.setItem('studentToken', studentResponse.data.token);
        await AsyncStorage.setItem('studentData', JSON.stringify(studentResponse.data.student));
        await AsyncStorage.setItem('userRole', 'student');
        
        return { 
          success: true, 
          role: 'student',
          user: studentResponse.data.student 
        };
      }
    } catch (studentError: any) {
      console.log('Student login failed:', studentError.response?.data || studentError.message);
      console.log('   ↳ URL tried:', studentError.config?.url, '| code:', studentError.code);
    }

    // SECOND: Try society login
    try {
      const societyResponse = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      console.log('Society login response:', societyResponse.data);

      if (societyResponse.data.token) {
        await AsyncStorage.setItem('societyToken', societyResponse.data.token);
        await AsyncStorage.setItem('societyData', JSON.stringify(societyResponse.data.society));
        await AsyncStorage.setItem('userRole', 'society');
        
        return { 
          success: true, 
          role: 'society',
          user: societyResponse.data.society 
        };
      }
    } catch (societyError: any) {
      console.log('Society login failed:', societyError.response?.data || societyError.message);
      console.log('   ↳ URL tried:', societyError.config?.url, '| code:', societyError.code);
    }

    // THIRD: Try member login
    try {
      const memberResponse = await axios.post(`${API_URL}/member/login`, {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      console.log('Member login response:', memberResponse.data);

      if (memberResponse.data.success || memberResponse.data.token) {
        await AsyncStorage.setItem('memberToken', memberResponse.data.token);
        await AsyncStorage.setItem('memberData', JSON.stringify(memberResponse.data.member));
        await AsyncStorage.setItem('userRole', 'member');

        return {
          success: true,
          role: 'member',
          user: memberResponse.data.member
        };
      }
    } catch (memberError: any) {
      console.log('Member login failed:', memberError.response?.data || memberError.message);
      console.log('   ↳ URL tried:', memberError.config?.url, '| code:', memberError.code);
    }

    // FOURTH: Try faculty login
    try {
      const facultyResponse = await axios.post(`${API_URL}/faculty/login`, {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      console.log('Faculty login response:', facultyResponse.data);

      if (facultyResponse.data.success && facultyResponse.data.token) {
        await AsyncStorage.setItem('facultyToken', facultyResponse.data.token);
        await AsyncStorage.setItem('facultyData', JSON.stringify(facultyResponse.data.faculty));
        await AsyncStorage.setItem('userRole', 'faculty');

        return {
          success: true,
          role: 'faculty',
          user: facultyResponse.data.faculty
        };
      }
    } catch (facultyError: any) {
      console.log('Faculty login failed:', facultyError.response?.data || facultyError.message);
      console.log('   ↳ URL tried:', facultyError.config?.url, '| code:', facultyError.code);
    }

    throw new Error('Invalid email or password');

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// ============ RESET PASSWORD (student / faculty only) ============
// role must be 'student' or 'faculty'. Backend verifies oldPassword before
// updating to newPassword. Throws with a readable message on failure.
export const resetPassword = async (
  role: 'student' | 'faculty',
  email: string,
  oldPassword: string,
  newPassword: string
) => {
  try {
    const endpoint =
      role === 'student'
        ? `${API_URL}/student/reset-password`
        : `${API_URL}/faculty/reset-password`;

    const response = await axios.post(endpoint, {
      email: email.trim().toLowerCase(),
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim(),
    });

    if (response.data.success) {
      return { success: true, message: response.data.message || 'Password updated successfully' };
    }

    throw new Error(response.data.message || 'Could not reset password');
  } catch (error: any) {
    console.log('Reset password failed:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Old password is incorrect or something went wrong.'
    );
  }
};

// ============ REFRESH MEMBER STATUS (live from server) ============
export const refreshMemberStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('memberToken');
    if (!token) return null;

    const response = await axios.get(`${API_URL}/member/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const updatedMember = response.data.member;
    if (updatedMember) {
      await AsyncStorage.setItem('memberData', JSON.stringify(updatedMember));
    }
    return updatedMember;
  } catch (error: any) {
    console.log('Refresh member status failed:', error.response?.data || error.message);
    return null;
  }
};

// ============ GET CURRENT USER ============
export const getCurrentUser = async () => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    if (role === 'student') {
      const data = await AsyncStorage.getItem('studentData');
      return data ? JSON.parse(data) : null;
    } else if (role === 'society') {
      const data = await AsyncStorage.getItem('societyData');
      return data ? JSON.parse(data) : null;
    } else if (role === 'member') {
      const data = await AsyncStorage.getItem('memberData');
      return data ? JSON.parse(data) : null;
    } else if (role === 'faculty') {
      const data = await AsyncStorage.getItem('facultyData');
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const getUserRole = async () => {
  return await AsyncStorage.getItem('userRole');
};
// ============ LOGOUT ============ ✅ SIRF EK BAAR
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('studentToken');
    await AsyncStorage.removeItem('studentData');
    await AsyncStorage.removeItem('societyToken');
    await AsyncStorage.removeItem('societyData');
    await AsyncStorage.removeItem('memberToken');
    await AsyncStorage.removeItem('memberData');
    await AsyncStorage.removeItem('facultyToken');
    await AsyncStorage.removeItem('facultyData');
    await AsyncStorage.removeItem('userRole');
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// ============ CHECK IF LOGGED IN ============
export const isLoggedIn = async () => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    if (role === 'student') {
      const token = await AsyncStorage.getItem('studentToken');
      return !!token;
    } else if (role === 'society') {
      const token = await AsyncStorage.getItem('societyToken');
      return !!token;
    } else if (role === 'member') {
      const token = await AsyncStorage.getItem('memberToken');
      return !!token;
    } else if (role === 'faculty') {
      const token = await AsyncStorage.getItem('facultyToken');
      return !!token;
    }
    return false;
  } catch (error) {
    return false;
  }
};