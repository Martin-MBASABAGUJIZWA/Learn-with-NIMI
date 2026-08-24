// app/api/creations/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { v4 as uuidv4 } from "uuid";
import { getServiceClient } from "@/lib/supabase/serviceClient";

// S2: SVG removed — allows stored XSS via script elements in SVG content.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const STORAGE_BUCKET = "creations";

// Service-role client — bypasses RLS for storage write


export async function POST(req: NextRequest) {
  const adminClient = getServiceClient();
  try {
    // 1. Auth — validate Bearer token from Authorization header
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const childName = (formData.get("childName") as string | null)?.trim() ?? "";
    const description = (formData.get("description") as string | null)?.trim() ?? "";
    const isPublic = formData.get("isPublic") === "true";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (childName.length < 2) return NextResponse.json({ error: "Child name too short" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5 MB limit", maxSize: MAX_FILE_SIZE, actualSize: file.size }, { status: 413 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type", allowedTypes: ALLOWED_MIME_TYPES, receivedType: file.type }, { status: 415 });
    }

    // 3. Upload to Supabase Storage — derive extension from verified MIME type, not filename
    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    const storagePath = `${user.id}/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // H1: Magic-bytes check — verify file content matches the declared MIME type,
    // not just the client-supplied Content-Type / file.type value.
    const magic = buffer.slice(0, 12);
    const mimeOk = (() => {
      if (file.type === "image/jpeg") return magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF;
      if (file.type === "image/png")  return magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E &&
        magic[3] === 0x47 && magic[4] === 0x0D && magic[5] === 0x0A && magic[6] === 0x1A && magic[7] === 0x0A;
      if (file.type === "image/gif")  return magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x38;
      if (file.type === "image/webp") return magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50;
      return true; // No magic-byte spec for this type (e.g. SVG); MIME allowlist above already gated it.
    })();
    if (!mimeOk) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 415 });
    }

    const { error: storageError } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    const imageUrl = `${STORAGE_BUCKET}/${storagePath}`;

    // 4. Insert creation row — get the parent row for this user
    const { data: parentRow } = await adminClient
      .from("parents")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!parentRow) {
      // Clean up orphaned file before returning error
      await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return NextResponse.json({ error: "Parent profile not found" }, { status: 403 });
    }

    const { data: creation, error: insertError } = await adminClient
      .from("creations")
      .insert({
        parent_id: parentRow.id,
        child_name: childName,
        description: description || null,
        image_url: imageUrl,
        type: "art",
        is_public: isPublic,
        completion_status: "completed",
      })
      .select("id, image_url, child_name, type, created_at")
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return NextResponse.json({ error: "Failed to save creation" }, { status: 500 });
    }

    return NextResponse.json(creation, { status: 201, headers: { "Cache-Control": "no-store" } });

  } catch (err: unknown) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
