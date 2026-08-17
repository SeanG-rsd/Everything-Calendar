import AppIntents

/// Registers fixed-phrase shortcuts so they show up in the Shortcuts app,
/// Siri, and Spotlight automatically once the app is installed — no
/// in-app "Add to Siri" donation step required. Apple caps AppShortcutsProvider
/// at 10 entries; this uses 9 (8 tabs + Log Food).
struct EcShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenTabIntent(tab: .tasks),
            phrases: ["Open Tasks in \(.applicationName)"],
            shortTitle: "Tasks",
            systemImageName: "checklist"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .health),
            phrases: ["Open Health in \(.applicationName)"],
            shortTitle: "Health",
            systemImageName: "heart.fill"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .dailyGoals),
            phrases: ["Open Daily Goals in \(.applicationName)"],
            shortTitle: "Daily Goals",
            systemImageName: "checkmark.seal.fill"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .financial),
            phrases: ["Open Financial in \(.applicationName)"],
            shortTitle: "Financial",
            systemImageName: "wallet.pass.fill"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .goals),
            phrases: ["Open Goals in \(.applicationName)"],
            shortTitle: "Goals",
            systemImageName: "flag.fill"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .projects),
            phrases: ["Open Projects in \(.applicationName)"],
            shortTitle: "Projects",
            systemImageName: "briefcase.fill"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .weight),
            phrases: ["Open Weight in \(.applicationName)"],
            shortTitle: "Weight",
            systemImageName: "chart.line.uptrend.xyaxis"
        )
        AppShortcut(
            intent: OpenTabIntent(tab: .other),
            phrases: ["Open Other in \(.applicationName)"],
            shortTitle: "Other",
            systemImageName: "ellipsis.circle.fill"
        )
        AppShortcut(
            intent: LogFoodIntent(),
            phrases: [
                "Log food in \(.applicationName)",
                "Add a meal in \(.applicationName)",
            ],
            shortTitle: "Log Food",
            systemImageName: "fork.knife"
        )
    }
}
