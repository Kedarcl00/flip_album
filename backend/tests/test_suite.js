const assert = require("assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");

async function runTests() {
    console.log("--- Starting Flip Album Test Suite ---");

    // Test 1: Bcrypt Password Hashing & Comparison
    console.log("Test 1: Bcrypt hashing & verification...");
    const rawPassword = "TestPassword@123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isMismatch = await bcrypt.compare("WrongPassword", hash);
    assert.strictEqual(isMatch, true, "Bcrypt match should be true");
    assert.strictEqual(isMismatch, false, "Bcrypt mismatch should be false");
    console.log("✔ Bcrypt password hashing passed.");

    // Test 2: JWT Token Signing and Verification
    console.log("Test 2: JWT signing and verification...");
    const secret = "test_jwt_secret_key";
    const payload = { id: "admin123", email: "admin@flipalbum.com", admin: true };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.email, "admin@flipalbum.com", "Decoded email must match");
    assert.strictEqual(decoded.admin, true, "Decoded admin must be true");
    console.log("✔ JWT verification passed.");

    // Test 3: Slugify Helper Validation
    console.log("Test 3: Slugify helper logic...");
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[\s\W-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
    assert.strictEqual(slugify("When Tirtha Turns One!"), "when-tirtha-turns-one");
    assert.strictEqual(slugify("Wedding & Reception 2026"), "wedding-reception-2026");
    assert.strictEqual(slugify("  Paris Travel Memories -- "), "paris-travel-memories");
    console.log("✔ Slugify helper passed.");

    // Test 4: QR Code Generation
    console.log("Test 4: QR code data URL generation...");
    const testUrl = "https://flip-album.vercel.app/album/wedding-memories";
    const qrDataUrl = await qrcode.toDataURL(testUrl, { width: 300 });
    assert.ok(qrDataUrl.startsWith("data:image/png;base64,"), "QR code must be a valid PNG data URL");
    console.log("✔ QR code generation passed.");

    // Test 5: Verify Model Definitions
    console.log("Test 5: Verifying Mongoose Schema Exports...");
    const Album = require("../models/Album");
    const Image = require("../models/Image");
    const Admin = require("../models/Admin");
    assert.ok(Album.schema.paths.slug, "Album schema must have slug");
    assert.ok(Album.schema.tree.theme || Album.schema.paths["theme.backgroundType"], "Album schema must have theme");
    assert.ok(Album.schema.paths.isDefault, "Album schema must have isDefault");
    assert.ok(Image.schema.paths.albumId, "Image schema must have albumId");
    assert.ok(Image.schema.paths.caption, "Image schema must have caption");
    assert.ok(Admin.schema.paths.email, "Admin schema must have email");
    console.log("✔ Mongoose schema structure passed.");

    console.log("\n==========================================");
    console.log("  ALL TESTS PASSED SUCCESSFULLY! (5/5)   ");
    console.log("==========================================\n");
}

runTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
