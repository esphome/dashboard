export const cleanName = (name: string) =>
  name
    // Convert uppercase to lower
    .toLowerCase()
    // Replace seperator characters with -
    .replace(/[ \._]/g, "-")
    // Remove the rest
    .replace(/[^a-z0-9-]/g, "");

export const stripDash = (name: string) =>
  name.replace(/^-+/, "").replace(/-+$/, "");
