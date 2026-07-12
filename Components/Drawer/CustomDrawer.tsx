import {
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";

import {
  View,
  StyleSheet,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

export default function CustomDrawer(props: any) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >

      <DrawerItem
        label="Account"
        icon={({ color, size }) => (
          <Ionicons
            name="person"
            color={color}
            size={size}
          />
        )}
        onPress={() => props.navigation.navigate("Account")} 
      />

      <DrawerItem
        label="Help & Support"
        icon={({ color, size }) => (
          <Ionicons
            name="chatbubble"
            color={color}
            size={size}
          />
        )}
        onPress={() => props.navigation.navigate("Help")}
      />

      <DrawerItem
        label="About FROSH"
        icon={({ color, size }) => (
          <Ionicons
            name="information-circle"
            color={color}
            size={size}
          />
        )}
        onPress={() => props.navigation.navigate("About")}
      />

      <DrawerItem
        label="Connect with us"
        icon={({ color, size }) => (
          <Ionicons
            name="link"
            color={color}
            size={size}
          />
        )}
        onPress={() => props.navigation.navigate("Connect")}
      />

      <DrawerItem
        label="Bootcamp"
        icon={({ color, size }) => (
          <Ionicons
            name="color-palette"
            color={color}
            size={size}
          />
        )}
        onPress={() => props.navigation.navigate("Bootcamp")}
      />

    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingTop: 50,
  },

});