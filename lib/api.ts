/**
 * API client — all AI calls go through Supabase Edge Functions.
 * The OpenAI API key is never exposed in the app.
 */
import { supabase } from './supabase';
import type { PaintInventory, MixSuggestionData } from './supabase';

export type KitColour = {
  colour_name: string;
  hex: string | null;
  notes: string | null;
};

export type KitLookupResult = {
  colours: KitColour[];
  source_notes: string;
};

/** Look up colours for a Gunpla kit by name or code */
export async function lookupKitColours(
  kitName: string,
  kitCode: string
): Promise<KitLookupResult> {
  const { data, error } = await supabase.functions.invoke('kit-lookup', {
    body: { kit_name: kitName, kit_code: kitCode },
  });
  if (error) throw new Error(error.message);
  return data as KitLookupResult;
}

/** Get AI mixing suggestion for a target colour, given owned paints */
export async function getMixSuggestion(
  targetColourName: string,
  targetHex: string | null,
  ownedPaints: PaintInventory[]
): Promise<MixSuggestionData> {
  const { data, error } = await supabase.functions.invoke('mix-suggestion', {
    body: {
      target_colour_name: targetColourName,
      target_hex: targetHex,
      owned_paints: ownedPaints,
    },
  });
  if (error) throw new Error(error.message);
  return data as MixSuggestionData;
}

/** Extract colour(s) from an image via GPT-4o vision */
export type ColourExtractionMode = 'dominant' | 'palette' | 'tap';

export type ExtractedColour = {
  hex: string;
  name: string;
};

export async function extractColourFromImage(
  base64Image: string,
  mode: ColourExtractionMode,
  tapCoords?: { x: number; y: number; imageWidth: number; imageHeight: number }
): Promise<ExtractedColour[]> {
  const { data, error } = await supabase.functions.invoke('colour-from-image', {
    body: { image_base64: base64Image, mode, tap_coords: tapCoords ?? null },
  });
  if (error) throw new Error(error.message);
  return data.colours as ExtractedColour[];
}

/** Identify a paint pot from a photo */
export type ScannedPaint = {
  brand: string;
  code: string | null;
  name: string;
  hex: string | null;
  confidence: 'high' | 'medium' | 'low';
};

export async function scanPaintPot(base64Image: string): Promise<ScannedPaint> {
  const { data, error } = await supabase.functions.invoke('scan-paint', {
    body: { image_base64: base64Image },
  });
  if (error) throw new Error(error.message);
  return data as ScannedPaint;
}
