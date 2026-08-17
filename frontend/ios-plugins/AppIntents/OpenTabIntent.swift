import AppIntents
import UIKit

/// Opens Everything Calendar straight to a specific tab via the
/// /open/<key> redirector (see frontend/src/app/(app)/open/[key].tsx),
/// which resolves the tab's actual current screen at runtime (native tab
/// bar vs. tab-modal) — this intent never has to know that itself.
struct OpenTabIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Tab"
    static var description = IntentDescription("Opens Everything Calendar to a specific tab.")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Tab")
    var tab: EcTab

    init() {}

    init(tab: EcTab) {
        self.tab = tab
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        if let url = URL(string: "everythingcalendar://open/\(tab.rawValue)") {
            await UIApplication.shared.open(url)
        }
        return .result()
    }
}
