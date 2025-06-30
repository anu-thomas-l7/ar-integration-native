import React, {useState} from 'react';
import {View, Text, Image, SafeAreaView} from 'react-native';
import Dashboard from '../screens/Dashboard';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import {Product} from '../screens/Product';
import ARScreen from '../screens/ARScreen';
import {Cart} from '../screens/Cart';
import {Wishlist} from '../screens/Wishlist';
import Tutorial from '../screens/Onboarding';
import {Header} from '../components/Header';
import Menu from '../components/Menu';
import SideMenu from '@chakrahq/react-native-side-menu';
import {Category} from '../screens/Category';

import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faHome, faUser, faHeart} from '@fortawesome/free-solid-svg-icons';
import styles from '../styles';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Icon from '@react-native-vector-icons/fontawesome';
import {
  faUser as faUserEmpty,
  faHeart as faHeartEmpty,
} from '@fortawesome/free-regular-svg-icons';

import {AuthStore} from '../store/auth';
import {observer} from 'mobx-react';

import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNavigationContainerRef} from '@react-navigation/native';
import Profile from '../screens/Profile';
import Orders from '../screens/Orders';
import Order from '../screens/Order';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const HomeStack = createStackNavigator();
const CartStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navigationRef = createNavigationContainerRef();

const menu = <Menu navigationRef={navigationRef} />;

const HomeTabs = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
      initialRouteName="Dashboard">
      {/* <Stack.Screen name="testVideo" component={testVideo} /> */}
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="ARScreen" component={ARScreen} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Category" component={Category} />
    </HomeStack.Navigator>
  );
};

const CartTabs = () => {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
      initialRouteName="Wishlist">
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Wishlist" component={Wishlist} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="ARScreen" component={ARScreen} />

      <Stack.Screen name="Category" component={Category} />
    </CartStack.Navigator>
  );
};

const ProfileTabs = () => {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
      initialRouteName="Profile">
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Order" component={Order} />
      <Stack.Screen name="Orders" component={Orders} />
    </CartStack.Navigator>
  );
};

const Tabs = ({navigation}) => {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            // height: 60,
            // paddingHorizontal: 5,
            // paddingTop: 0,
            backgroundColor: '#c40f28',
            // position: 'absolute',
            // borderTopWidth: 0,
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeTabs}
          options={{
            tabBarLabel: ({focused, color, size}) => (
              <Text style={styles.bottomTabText}>Home</Text>
            ),
            tabBarIcon: ({focused}) => (
              <FontAwesomeIcon
                icon={faHome}
                color={focused ? '#fff' : '#D3D3D3'}
                size={focused ? 20 : 15}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Wishlist"
          component={CartTabs}
          options={{
            tabBarLabel: ({focused, color, size}) => (
              <Text style={styles.bottomTabText}>Wishlist</Text>
            ),
            tabBarIcon: ({focused}) => (
              <FontAwesomeIcon
                icon={focused ? faHeart : faHeartEmpty}
                color={focused ? '#fff' : '#D3D3D3'}
                size={focused ? 20 : 15}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileTabs}
          options={{
            tabBarLabel: ({focused, color, size}) => (
              <Text style={styles.bottomTabText}>Profile</Text>
            ),
            tabBarIcon: ({focused}) => (
              <FontAwesomeIcon
                icon={focused ? faUser : faUserEmpty}
                color={focused ? '#fff' : '#D3D3D3'}
                size={focused ? 20 : 15}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
};

export const Navigator = observer(() => {
  const [openMenu, setOpenMenu] = useState(false);

  const {
    state: {isAuthenticated},
  } = AuthStore;

  return (
    <>
      {isAuthenticated ? (
        <SideMenu menu={menu} isOpen={openMenu} autoClosing={true}>
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
              initialRouteName="Main">
              <Stack.Screen name="Main" component={Tabs} />
            </Stack.Navigator>
          </NavigationContainer>
        </SideMenu>
      ) : (
        // <SafeAreaView style={{flex: 1, backgroundColor: '#c61129'}}>
        //   <SideMenu menu={menu} isOpen={openMenu} autoClosing={true}>
        //     <Header setOpenMenu={setOpenMenu} navigationRef={navigationRef} />
        //     <NavigationContainer ref={navigationRef}>
        //       <Stack.Navigator
        //         screenOptions={{
        //           headerShown: false,
        //         }}
        //         initialRouteName="Main">
        //         <Stack.Screen name="Main" component={Tabs} />
        //       </Stack.Navigator>
        //     </NavigationContainer>
        //   </SideMenu>
        // </SafeAreaView>
        <>
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
              initialRouteName="Onboarding">
              <Stack.Screen name="Onboarding" component={Tutorial} />
              <Stack.Screen name="signup" component={Signup} />
              <Stack.Screen name="login" component={Login} />
            </Stack.Navigator>
          </NavigationContainer>
        </>
      )}
    </>
  );
});
