import AppIntents
import UIKit

/// One-tap "log a meal" shortcut — opens straight into Health's Add-food
/// prompt via the /open/health?action=addFood deep link (see
/// DietModuleView.tsx's autoOpenAdd prop).
struct LogFoodIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Food"
    static var description = IntentDescription("Opens Everything Calendar straight into the Add-food prompt.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        if let url = URL(string: "everythingcalendar://open/health?action=addFood") {
            await UIApplication.shared.open(url)
        }
        return .result()
    }
}
