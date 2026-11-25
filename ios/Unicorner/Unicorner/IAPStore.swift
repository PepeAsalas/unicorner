import Foundation
import StoreKit

/// Apple In-App Purchases for Unicorner Infinity (StoreKit 2).
/// Every verified purchase is sent to the page as a signed JWS; the site passes it to the
/// apple-iap Supabase function, which checks it with Apple and unlocks Infinity.
@MainActor
final class IAPStore {
    static let productIDs = ["lol.unicornergame.infinity.forever", "lol.unicornergame.infinity.monthly"]

    var send: ([String: Any]) -> Void = { _ in }
    private var updates: Task<Void, Never>?

    init() {
        // Renewals, refunds, Ask to Buy approvals and purchases made outside the app.
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                await self?.handle(result, source: "update")
            }
        }
    }

    func loadProducts() async {
        do {
            let products = try await Product.products(for: Self.productIDs)
            send(["type": "products", "products": products.map {
                ["id": $0.id, "price": $0.displayPrice, "name": $0.displayName, "description": $0.description]
            }])
        } catch {
            send(["type": "error", "message": error.localizedDescription])
        }
    }

    /// account: the player's Unicorner user id (a UUID), so Apple ties the purchase to that account.
    func buy(_ id: String, account: String?) async {
        do {
            guard let product = try await Product.products(for: [id]).first else {
                send(["type": "error", "message": "This item is not available right now."])
                return
            }
            var options: Set<Product.PurchaseOption> = []
            if let account, let uuid = UUID(uuidString: account) {
                options.insert(.appAccountToken(uuid))
            }
            switch try await product.purchase(options: options) {
            case .success(let result): await handle(result, source: "buy")
            case .userCancelled: send(["type": "cancelled"])
            case .pending: send(["type": "pending"])
            @unknown default: send(["type": "cancelled"])
            }
        } catch {
            send(["type": "error", "message": error.localizedDescription])
        }
    }

    /// The "Restore purchases" button: asks the App Store, then re-sends everything the player owns.
    func restore() async {
        try? await AppStore.sync()
        let count = await sendEntitlements()
        send(["type": "restored", "count": count])
    }

    /// Re-sends what the player owns, without any sign-in prompt. The page calls this on load.
    @discardableResult
    func sendEntitlements() async -> Int {
        var count = 0
        for await result in Transaction.currentEntitlements {
            await handle(result, source: "entitlement")
            count += 1
        }
        return count
    }

    private func handle(_ result: VerificationResult<Transaction>, source: String) async {
        guard case .verified(let transaction) = result else {
            send(["type": "error", "message": "The purchase could not be verified."])
            return
        }
        send([
            "type": "purchase",
            "source": source,
            "product": transaction.productID,
            "transactionId": String(transaction.originalID),
            "revoked": transaction.revocationDate != nil,
            "jws": result.jwsRepresentation,
        ])
        await transaction.finish()
    }
}
