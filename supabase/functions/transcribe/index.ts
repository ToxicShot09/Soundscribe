// Supabase Edge Function: transcribe
// Forwards a user's uploaded audio file to OpenAI's Whisper API.
//
// Deploy:  supabase functions deploy transcribe
// Secret:  supabase secrets set OPENAI_API_KEY=sk-...

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Client scoped to the caller's JWT: storage RLS guarantees users can
    // only transcribe their own files.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return json({ error: "OPENAI_API_KEY is not configured" }, 500);
    }

    const { file_path, language, task = "transcribe" } = await req.json();
    if (!file_path || typeof file_path !== "string") {
      return json({ error: "file_path is required" }, 400);
    }
    if (task !== "transcribe" && task !== "translate") {
      return json({ error: `Unsupported task: ${task}` }, 400);
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from("audio_files")
      .download(file_path);
    if (downloadError || !blob) {
      console.error("Storage download error:", downloadError);
      return json({ error: "Could not download audio file" }, 404);
    }

    // OpenAI infers the audio format from the filename extension.
    const fileName = file_path.split("/").pop() ?? "audio.mp3";
    const form = new FormData();
    form.append("file", blob, fileName);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    // The translations endpoint always outputs English and takes no language param.
    if (task === "transcribe" && language && language !== "auto") {
      form.append("language", language);
    }

    const endpoint = task === "translate" ? "translations" : "transcriptions";
    const openaiRes = await fetch(`https://api.openai.com/v1/audio/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: form,
    });

    if (!openaiRes.ok) {
      console.error("OpenAI error:", openaiRes.status, await openaiRes.text());
      return json({ error: "Transcription provider error" }, 502);
    }

    const result = await openaiRes.json();
    const chunks = (result.segments ?? []).map(
      (s: { text: string; start: number; end: number }) => ({
        text: s.text,
        timestamp: [s.start, s.end],
      }),
    );

    return json({
      text: (result.text ?? "").trim(),
      chunks,
      task,
      // verbose_json reports the detected language as a name, e.g. "english"
      source_language: result.language ?? language ?? "auto",
      target_language: task === "translate" ? "en" : null,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "Unexpected error processing audio" }, 500);
  }
});
