import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from 'react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import InstallerDashboard from './src/screens/InstallerDashboard';
import SurveyorDashboard from './src/screens/SurveyorDashboard';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import PhotoCaptureScreen from './src/screens/PhotoCaptureScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import SurveyFormScreen from './src/screens/SurveyFormScreen';

// Services
import { AuthProvider, useAuth } from './src/services/AuthService';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        <>
          {user.role === 'INSTALLER' && (
            <>
              <Stack.Screen 
                name="InstallerDashboard" 
                component={InstallerDashboard}
                options={{ title: 'My Jobs' }}
              />
              <Stack.Screen 
                name="JobDetails" 
                component={JobDetailsScreen}
                options={{ title: 'Job Details' }}
              />
              <Stack.Screen 
                name="PhotoCapture" 
                component={PhotoCaptureScreen}
                options={{ title: 'Take Photos' }}
              />
              <Stack.Screen 
                name="CheckIn" 
                component={CheckInScreen}
                options={{ title: 'Check In/Out' }}
              />
            </>
          )}
          
          {user.role === 'SURVEYOR' && (
            <>
              <Stack.Screen 
                name="SurveyorDashboard" 
                component={SurveyorDashboard}
                options={{ title: 'My Surveys' }}
              />
              <Stack.Screen 
                name="SurveyForm" 
                component={SurveyFormScreen}
                options={{ title: 'Survey Details' }}
              />
              <Stack.Screen 
                name="PhotoCapture" 
                component={PhotoCaptureScreen}
                options={{ title: 'Take Photos' }}
              />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }}>
      <ActivityIndicator size="large" color="#f59e0b" />
      <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>Loading Nexus CRM...</Text>
    </View>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
