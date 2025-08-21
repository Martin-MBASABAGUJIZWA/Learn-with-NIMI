"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import supabase from "@/lib/supabaseClient";
import { useSession } from "@supabase/auth-helpers-react";

export function UserProfileMenu() {
  const session = useSession();
  const { toast } = useToast();
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>({
    id: "",
    auth_user_id: "",
    name: "",
    email: "",
    subscription_status: "free",
    preferred_language: "en",
    avatar_url: "",
    notify_email: true,
    notify_sms: false,
    bio: "",
    date_of_birth: "",
    status: "pending",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const initial = useMemo(() => (profile.name?.[0] || "U").toUpperCase(), [profile.name]);

  // --- Fetch or create profile ---
  useEffect(() => {
    if (!session?.user?.id) return;
  
    const fetchOrCreateProfile = async () => {
      setIsLoading(true);
  
      try {
        // 1️⃣ Try to fetch existing profile
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single();
  
        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Fetch profile error:", fetchError);
          toast({
            title: "Error",
            description: fetchError.message || "Failed to fetch profile",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
  
        if (data) {
          setProfile(data);
          setIsLoading(false);
          return;
        }
  
        // 2️⃣ Profile not found → create one
        const defaultProfile = {
          auth_user_id: session.user.id, // MUST match RLS check
          name: session.user.user_metadata?.full_name || "Parent",
          email: session.user.email || null,
          status: "pending",
          subscription_status: "free",
          preferred_language: "en",
          avatar_url: null,
          notify_email: true,
          notify_sms: false,
          bio: null,
          date_of_birth: null,
        };
  
        const { data: insertData, error: insertError } = await supabase
          .from("users")
          .insert(defaultProfile)
          .select()
          .single();
  
        if (insertError) {
          console.error("Insert profile error:", insertError);
          toast({
            title: "Error",
            description: insertError.message || "Failed to create profile",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
  
        setProfile(insertData);
        console.log("Profile created successfully:", insertData);
  
      } catch (err: any) {
        console.error("Profile fetch/create exception:", err);
        toast({
          title: "Error",
          description: err.message || "Unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchOrCreateProfile();
  }, [session?.user?.id, toast]);
  
  

  // --- Save profile ---
  const saveProfile = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: profile.name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          date_of_birth: profile.date_of_birth,
          preferred_language: profile.preferred_language,
          notify_email: profile.notify_email,
          notify_sms: profile.notify_sms,
        })
        .eq("auth_user_id", session.user.id)
        .select()
        .single();

      if (error) {
        console.error("Update profile error:", error);
        toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      setProfile(data);
      toast({ title: "Profile Saved", description: "Your profile has been updated." });
    } catch (err) {
      console.error("Save profile exception:", err);
      toast({ title: "Error", description: "Unexpected error occurred", variant: "destructive" });
    }
    setIsLoading(false);
  };

  // --- Avatar upload ---
  const cropImageToSquare = async (file: File, size = 256): Promise<File> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context not found"));

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to create blob"));
            resolve(new File([blob], file.name, { type: "image/png" }));
          },
          "image/png",
          0.95
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });

  const handleAvatarUpload = async (file: File) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const croppedFile = await cropImageToSquare(file);
      const fileExt = croppedFile.name.split(".").pop();
      const fileName = `${session.user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(`avatars/${fileName}`, croppedFile, { upsert: true });    

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(`avatars/${fileName}`);

      if (publicData?.publicUrl) {
        setProfile((p: any) => ({ ...p, avatar_url: publicData.publicUrl }));
        if (setUser) {
          setUser({ ...user, avatar_url: publicData.publicUrl });
        }
        toast({ title: "Avatar Updated" });
      }
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast({ 
        title: "Upload Error", 
        description: err.message || "Failed to upload avatar", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Drag & Drop ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleAvatarUpload(e.dataTransfer.files[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="inline-flex items-center justify-center rounded-full h-10 w-10 border bg-white shadow-sm hover:bg-muted" 
          aria-label="User Profile"
          disabled={isLoading}
        >
          <Avatar className="h-10 w-10">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Profile" />
            ) : (
              <AvatarFallback>
                {isLoading ? "..." : initial}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {/* Avatar */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-4 flex items-center justify-center w-full h-32 border-2 rounded-md cursor-pointer ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-300"
          } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <span className="text-gray-500">
              {isLoading ? "Uploading..." : "Click or Drag & Drop Avatar"}
            </span>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => e.target.files && handleAvatarUpload(e.target.files[0])}
            disabled={isLoading}
          />
        </div>

        {/* Profile fields */}
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={profile.name} 
              onChange={(e) => setProfile((p: any) => ({ ...p, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Input 
              id="bio" 
              value={profile.bio || ""} 
              onChange={(e) => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input 
              id="dob" 
              type="date" 
              value={profile.date_of_birth || ""} 
              onChange={(e) => setProfile((p: any) => ({ ...p, date_of_birth: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="preferred_language">Language</Label>
            <Input 
              id="preferred_language" 
              value={profile.preferred_language || ""} 
              onChange={(e) => setProfile((p: any) => ({ ...p, preferred_language: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="font-medium">Email Notifications</div>
            <Switch 
              checked={profile.notify_email} 
              onCheckedChange={(v) => setProfile((p: any) => ({ ...p, notify_email: v }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="font-medium">SMS Notifications</div>
            <Switch 
              checked={profile.notify_sms} 
              onCheckedChange={(v) => setProfile((p: any) => ({ ...p, notify_sms: v }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="font-medium">Subscription</div>
            <span className={`font-bold ${profile.subscription_status === "premium" ? "text-purple-700" : "text-gray-700"}`}>
              {profile.subscription_status}
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <Button onClick={saveProfile} className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (user) supabase.auth.signOut().then(() => location.reload());
              else location.href = "/loginpage";
            }}
            disabled={isLoading}
          >
            {user ? "Logout" : "Login"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}