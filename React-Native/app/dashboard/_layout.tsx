import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="courses"
        options={{
          title: "Courses",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="assessments"
        options={{
          title: "Assessments",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          title: "Achievements",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="community"
        options={{
          title: "Community",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          title: "Calender",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
