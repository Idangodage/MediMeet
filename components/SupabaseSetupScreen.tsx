import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Card } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { colors, spacing, typography } from "@/constants/theme";
import { getMissingEnvVars } from "@/lib/env";

export function SupabaseSetupScreen() {
  const missingEnvVars = getMissingEnvVars();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>MediMeet</Text>
        <Text style={styles.title}>Supabase environment required</Text>
        <Text style={styles.subtitle}>
          The app can load now, but authentication is disabled until Supabase
          public config is provided.
        </Text>
      </View>

      <Card title="Missing variables">
        {missingEnvVars.map((name) => (
          <Text key={name} style={styles.envName}>
            {name}
          </Text>
        ))}
      </Card>

      <Card title="Fix">
        <Text style={styles.instructions}>
          Create a `.env` file in the project root using `.env.example`, add
          your Supabase Project URL and anon public key, then restart Expo with:
        </Text>
        <Text style={styles.command}>npx expo start -c</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center"
  },
  header: {
    gap: spacing.sm
  },
  brand: {
    color: colors.primary,
    fontSize: typography.subtitle,
    ...fontStyles.extraBold
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 34,
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    ...fontStyles.regular
  },
  envName: {
    color: colors.danger,
    fontSize: typography.body,
    ...fontStyles.bold
  },
  instructions: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
    ...fontStyles.regular
  },
  command: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.body,
    padding: spacing.md,
    ...fontStyles.bold
  }
});
