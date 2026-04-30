import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";

const slides = [
  {
    title: "Search Verified Doctors",
    body: "Patients can search by specialty, location, language, fee, and availability before creating an account."
  },
  {
    title: "Book Appointments Easily",
    body: "Choose date, time, and location, then book a private appointment in a few guided steps."
  },
  {
    title: "Manage Your Visits",
    body: "Track upcoming appointments, previous visits, cancelled bookings, and doctors you have already visited."
  },
  {
    title: "Grow Your Private Practice",
    body: "Doctors can create professional profiles, manage availability, receive bookings, and use SaaS tools."
  },
  {
    title: "Privacy and Trust First",
    body: "Doctors only see patients connected to their own appointments or existing doctor-patient relationships."
  }
] as const;

export function OnboardingCarouselScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];
  const isFinalSlide = activeIndex === slides.length - 1;

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.slideCard}>
        <Badge label={`Step ${activeIndex + 1} of ${slides.length}`} variant="primary" />
        <View style={styles.illustration}>
          <Text style={styles.illustrationText}>{activeIndex + 1}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <View style={styles.dots}>
          {slides.map((item, index) => (
            <View
              key={item.title}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <Button
            title={isFinalSlide ? "Choose Your Role" : "Next"}
            onPress={() => {
              if (isFinalSlide) {
                router.push(ROUTES.roleSelection);
                return;
              }

              setActiveIndex((current) => current + 1);
            }}
          />
          {activeIndex > 0 ? (
            <Button
              title="Back"
              variant="secondary"
              onPress={() => setActiveIndex((current) => current - 1)}
            />
          ) : null}
          <Button
            title="Skip to role selection"
            variant="ghost"
            onPress={() => router.push(ROUTES.roleSelection)}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center"
  },
  slideCard: {
    alignItems: "center",
    gap: spacing.lg
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
    width: 132,
    height: 132,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint
  },
  illustrationText: {
    color: colors.primary,
    fontSize: 54,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: "center"
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: "center"
  },
  dots: {
    flexDirection: "row",
    gap: spacing.sm
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong
  },
  activeDot: {
    width: 26,
    backgroundColor: colors.primary
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.md
  }
});
