import AppIntents

/// Mirrors TabKey / TAB_DEFINITIONS in frontend/src/lib/tabs.ts, plus the
/// fixed "other" tab from (tabs)/_layout.tsx. Raw values match the route
/// segment each tab resolves to under everythingcalendar://open/<rawValue>.
enum EcTab: String, AppEnum {
    case tasks
    case health
    case dailyGoals = "daily-goals"
    case financial
    case goals
    case projects
    case weight
    case other

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Tab"

    static var caseDisplayRepresentations: [EcTab: DisplayRepresentation] = [
        .tasks: DisplayRepresentation(title: "Tasks"),
        .health: DisplayRepresentation(title: "Health"),
        .dailyGoals: DisplayRepresentation(title: "Daily Goals"),
        .financial: DisplayRepresentation(title: "Financial"),
        .goals: DisplayRepresentation(title: "Goals"),
        .projects: DisplayRepresentation(title: "Projects"),
        .weight: DisplayRepresentation(title: "Weight"),
        .other: DisplayRepresentation(title: "Other"),
    ]
}
