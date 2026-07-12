import { createDrawerNavigator } from "@react-navigation/drawer";
import BottomTabs from "./BottomTabs";
import CustomDrawer from "../Components/Drawer/CustomDrawer";
import AccountScreen from "../screens/Account/AccountScreen";
import HelpScreen from "../screens/Help/HelpScreen";
import AboutScreen from "../screens/About/AboutScreen";
import ConnectScreen from "../screens/Connect/ConnectScreen";
import BootcampScreen from "../screens/Bootcamp/Bootcampscreen";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
  drawerContent={(props) => (
    <CustomDrawer {...props} />
  )}
  screenOptions={{
    headerShown: false,
  }}
>
      <Drawer.Screen
        name="Main"
        component={BottomTabs}
      />
      <Drawer.Screen
  name="Account"
  component={AccountScreen}
/>

<Drawer.Screen
  name="Help"
  component={HelpScreen}
/>

<Drawer.Screen
  name="About"
  component={AboutScreen}
/>

<Drawer.Screen
  name="Connect"
  component={ConnectScreen}
/>

<Drawer.Screen
  name="Bootcamp"
  component={BootcampScreen}
/>
    </Drawer.Navigator>
  );
}