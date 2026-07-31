import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { RootStackParamList } from "../../types/navigation";
import { getMyProfile, uploadProfilePhoto, StudentProfile } from "../../services/student";

import { useAppTheme } from "../../context/ThemeContext";
import { useHomeTheme } from "../../constants/homeThemes";
import { useTopInset } from "../../hooks/useTopInset";
import ProfileHeader from "../../Components/Account/ProfileHeader";
import InfoCard from "../../Components/Account/InfoCard";

const { height: screenHeight } = Dimensions.get("window");

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

type FacultyProfile = {
  name: string;
  email: string;
  department: string;
  phoneNo: string;
  teacherNo: string;
};

const formatDob = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const getMyFacultyProfile = async (): Promise<FacultyProfile> => {
  const token = await AsyncStorage.getItem("facultyToken");
  const res = await fetch("https://frosh-app-backend.onrender.com/api/faculty/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load your account.");
  return data.faculty;
};

export default function AccountScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { isDarkMode } = useAppTheme();
  const theme = useHomeTheme();
  const topInset = useTopInset();

  const [role, setRole] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  // --- Entry animation (slide up from bottom / fade in) ---
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  // Disable the navigator's own push/pop transition & gesture for this screen.
  useEffect(() => {
    navigation.setOptions({
      animation: "none",
      gestureEnabled: false,
    });
  }, [navigation]);

  // Run entry animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Exit animation (slide down + fade out) triggered by any back action ---
  // Intercept 'beforeRemove' to run our custom animation before the screen is popped.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      // If we are already animating out, let it pass through (the animation already dispatched the action)
      if (isNavigating.current) return;

      // Prevent the default removal so we can animate first
      e.preventDefault();
      isNavigating.current = true;

      Animated.parallel([
        Animated.timing(slideY, {
          toValue: screenHeight,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          // Now that the animation has completed, dispatch the original action.
          navigation.dispatch(e.data.action);
        }
        // Reset the flag after dispatching (though the screen will be unmounted).
        isNavigating.current = false;
      });
    });

    return unsubscribe;
  }, [navigation]);

  // The header back button now simply calls goBack(), which will be intercepted by 'beforeRemove'.
  const handleBack = () => {
    if (isNavigating.current) return;
    navigation.goBack();
  };

  const fetchProfile = useCallback(async () => {
    try {
      const userRole = await AsyncStorage.getItem("userRole");
      setRole(userRole);

      if (userRole === "faculty") {
        const data = await getMyFacultyProfile();
        setFacultyProfile(data);
      } else {
        const data = await getMyProfile();
        setStudentProfile(data);
      }
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error || error?.message || "Could not load your account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  // Compress image before upload
  const compressForUpload = async (uri: string) => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 500 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  };

  const pickAndUploadPhoto = async (source: "camera" | "gallery") => {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          `Please allow ${source === "camera" ? "camera" : "photo library"} access to set a profile photo.`
        );
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingPhoto(true);

      const compressedUri = await compressForUpload(result.assets[0].uri);
      const newUrl = await uploadProfilePhoto(compressedUri);

      setStudentProfile((prev) => (prev ? { ...prev, profileImage: newUrl } : prev));
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error?.response?.data?.error || error?.message || "Could not upload photo. Please try again."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert("Profile Photo", "Choose a source", [
      { text: "Camera", onPress: () => pickAndUploadPhoto("camera") },
      { text: "Choose from Gallery", onPress: () => pickAndUploadPhoto("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgGradient[0] }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <Animated.View
        style={[
          {
            flex: 1,
            opacity: opacityAnim,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.bgGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
            <ScrollView
              contentContainerStyle={styles.container}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.textSecondary}
                />
              }
            >
              <View style={[styles.header, { marginTop: topInset }]}>
                <TouchableOpacity onPress={handleBack}>
                  <Ionicons name="arrow-back" size={26} color={theme.iconColor} />
                </TouchableOpacity>
                <Text style={[styles.heading, { color: theme.textPrimary }]}>My Account</Text>
                <View style={{ width: 26 }} />
              </View>

              {loading ? (
                <ActivityIndicator color={theme.accent} size="large" style={styles.loader} />
              ) : loadError ? (
                <View style={styles.errorBox}>
                  <Text style={[styles.errorText, { color: theme.danger }]}>⚠️ {loadError}</Text>
                </View>
              ) : role === "faculty" && facultyProfile ? (
                <>
                  <ProfileHeader name={facultyProfile.name} email={facultyProfile.email} />
                  <InfoCard label="Department" value={facultyProfile.department} />
                  <InfoCard label="Phone Number" value={facultyProfile.phoneNo} />
                  <InfoCard label="Teacher No." value={facultyProfile.teacherNo} />
                </>
              ) : studentProfile ? (
                <>
                  <View style={styles.photoSection}>
                    <TouchableOpacity
                      activeOpacity={studentProfile.profileImage ? 0.8 : 1}
                      onPress={() => {
                        if (studentProfile.profileImage) setPhotoViewerVisible(true);
                      }}
                      style={[styles.avatarWrap, { borderColor: theme.accent }]}
                    >
                      {studentProfile.profileImage ? (
                        <Image
                          source={{ uri: studentProfile.profileImage }}
                          style={styles.avatar}
                        />
                      ) : (
                        <Ionicons name="person" size={44} color={theme.iconColor} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddPhoto}
                      disabled={uploadingPhoto}
                      style={[styles.photoBtn, { backgroundColor: theme.accent }]}
                    >
                      {uploadingPhoto ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.photoBtnText}>
                          {studentProfile.profileImage ? "Change Photo" : "Add Photo"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <ProfileHeader name={studentProfile.name} email={studentProfile.email} />
                  <InfoCard label="Roll Number" value={studentProfile.rollNo} />
                  <InfoCard label="Branch" value={studentProfile.branch} />
                  <InfoCard label="Phone Number" value={studentProfile.phoneNo} />
                  <InfoCard label="Date of Birth" value={formatDob(studentProfile.dob)} />
                  <InfoCard label="Bootcamp Batch" value={studentProfile.batch || "Not assigned yet"} />
                  <InfoCard label="Father's Name" value={studentProfile.fatherName} />
                  <InfoCard label="Mother's Name" value={studentProfile.motherName} />
                </>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {studentProfile?.profileImage && (
        <Modal
          visible={photoViewerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoViewerVisible(false)}
        >
          <TouchableOpacity
            style={styles.viewerBackdrop}
            activeOpacity={1}
            onPress={() => setPhotoViewerVisible(false)}
          >
            <TouchableOpacity
              style={[styles.viewerCloseBtn, { top: topInset }]}
              onPress={() => setPhotoViewerVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: studentProfile.profileImage }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: "700" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  loader: { marginTop: 60 },
  errorBox: { marginTop: 60, alignItems: "center", paddingHorizontal: 20 },
  errorText: { fontSize: 15, textAlign: "center" },
  photoSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  photoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: "center",
  },
  photoBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCloseBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  viewerImage: {
    width: "100%",
    height: "70%",
  },
});