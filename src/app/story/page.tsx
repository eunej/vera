import { redirect } from "next/navigation";

/** Legacy path — story is now the home page. */
export default function StoryRedirect() {
  redirect("/");
}
