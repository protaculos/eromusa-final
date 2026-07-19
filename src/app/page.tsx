"use client";
import React, { useState, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import TemplateCard from '@/components/video/TemplateCard';
import VideoCreateModal from '@/components/video/VideoCreateModal';
import LoginModal from '@/components/LoginModal';
import PaymentModal from '@/components/PaymentModal';

// ============================================
// Types
// ============================================
interface Template {
  id: string;
  title: string;
  thumbnail: string;
  isFree: boolean;
  isPopular: boolean;
  tags: string[];
  videoUrl: string;
  gradient: string;
  duration: string;
  credits: number;
  instructions: string[];
  styleId: string;
}

// ============================================
// Gradients
// ============================================
const gradients = [
  "from-orange-500 via-pink-500 to-purple-600",
  "from-cyan-400 via-blue-500 to-purple-600",
  "from-amber-500 via-orange-500 to-rose-600",
  "from-gray-600 via-gray-500 to-zinc-700",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-yellow-400 via-amber-500 to-orange-500",
  "from-slate-700 via-gray-600 to-zinc-800",
  "from-fuchsia-500 via-pink-500 to-rose-600",
  "from-red-500 via-orange-500 to-yellow-500",
  "from-teal-400 via-cyan-500 to-blue-600",
  "from-purple-500 via-pink-500 to-red-500",
  "from-green-400 via-emerald-500 to-teal-600",
];

// ============================================
// 88 Templates
// ============================================
const allTemplates: Template[] = [
  { id: "1", title: "Cinematic Portrait", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/cinematic_portrait.webp", isFree: true, isPopular: true, tags: ["cinematic", "portrait", "romantic"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "2", title: "Neon Dreams", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/neon_dreams.webp", isFree: false, isPopular: true, tags: ["neon", "cyberpunk", "vibrant"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "3", title: "Vintage Vibes", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/vintage_vibes.webp", isFree: false, isPopular: false, tags: ["vintage", "retro", "warm"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "4", title: "Dark Elegance", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/dark_elegance.webp", isFree: false, isPopular: true, tags: ["dark", "elegant", "moody"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "5", title: "Romantic Couple", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/romantic_couple.webp", isFree: true, isPopular: true, tags: ["romantic", "couple", "intimate"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "6", title: "Passionate Kiss", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/passionate_kiss.webp", isFree: false, isPopular: true, tags: ["passionate", "kiss", "romantic"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "7", title: "Golden Hour", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/golden_hour.webp", isFree: false, isPopular: false, tags: ["golden", "sunset", "warm"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "8", title: "Midnight Romance", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/midnight_romance.webp", isFree: false, isPopular: true, tags: ["midnight", "romance", "dark"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "9", title: "Soft Glow", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/soft_glow.webp", isFree: true, isPopular: false, tags: ["soft", "glow", "ethereal"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "10", title: "Tropical Heat", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/tropical_heat.webp", isFree: false, isPopular: false, tags: ["tropical", "beach", "summer"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "11", title: "Velvet Touch", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/velvet_touch.webp", isFree: false, isPopular: true, tags: ["velvet", "luxury", "smooth"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "12", title: "Candlelight", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/candlelight.webp", isFree: false, isPopular: false, tags: ["candle", "warm", "intimate"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "13", title: "Sunset Lovers", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/sunset_lovers.webp", isFree: true, isPopular: true, tags: ["sunset", "lovers", "romantic"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "14", title: "Moonlit Dance", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/moonlit_dance.webp", isFree: false, isPopular: false, tags: ["moon", "dance", "night"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "15", title: "Silk & Lace", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/silk_lace.webp", isFree: false, isPopular: true, tags: ["silk", "lace", "elegant"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "16", title: "Desert Heat", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/desert_heat.webp", isFree: false, isPopular: false, tags: ["desert", "heat", "adventure"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "17", title: "Ocean Breeze", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/ocean_breeze.webp", isFree: true, isPopular: false, tags: ["ocean", "breeze", "fresh"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "18", title: "Forbidden Love", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/forbidden_love.webp", isFree: false, isPopular: true, tags: ["forbidden", "love", "dramatic"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "19", title: "Cherry Blossom", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/cherry_blossom.webp", isFree: false, isPopular: false, tags: ["cherry", "blossom", "japanese"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "20", title: "Burning Desire", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/burning_desire.webp", isFree: false, isPopular: true, tags: ["burning", "desire", "passion"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "21", title: "Starlight", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/starlight.webp", isFree: true, isPopular: false, tags: ["star", "light", "night"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "22", title: "Whisper", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/whisper.webp", isFree: false, isPopular: false, tags: ["whisper", "soft", "intimate"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "23", title: "Scarlet Night", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/scarlet_night.webp", isFree: false, isPopular: true, tags: ["scarlet", "night", "dramatic"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "24", title: "Amber Glow", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/amber_glow.webp", isFree: false, isPopular: false, tags: ["amber", "glow", "warm"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "25", title: "Twilight Embrace", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/twilight_embrace.webp", isFree: true, isPopular: true, tags: ["twilight", "embrace", "romantic"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "26", title: "Crimson Tide", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/crimson_tide.webp", isFree: false, isPopular: false, tags: ["crimson", "tide", "passion"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "27", title: "Ivory Tower", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/ivory_tower.webp", isFree: false, isPopular: false, tags: ["ivory", "tower", "elegant"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "28", title: "Sapphire Dream", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/sapphire_dream.webp", isFree: false, isPopular: true, tags: ["sapphire", "dream", "blue"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "29", title: "Rose Garden", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/rose_garden.webp", isFree: true, isPopular: false, tags: ["rose", "garden", "floral"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "30", title: "Obsidian", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/obsidian.webp", isFree: false, isPopular: false, tags: ["obsidian", "dark", "mysterious"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "31", title: "Coral Reef", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/coral_reef.webp", isFree: false, isPopular: false, tags: ["coral", "reef", "vibrant"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "32", title: "Frost", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/frost.webp", isFree: false, isPopular: true, tags: ["frost", "ice", "cold"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "33", title: "Ember", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/ember.webp", isFree: true, isPopular: false, tags: ["ember", "fire", "warm"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "34", title: "Misty Morning", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/misty_morning.webp", isFree: false, isPopular: false, tags: ["misty", "morning", "soft"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "35", title: "Lavender Haze", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/lavender_haze.webp", isFree: false, isPopular: true, tags: ["lavender", "haze", "purple"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "36", title: "Copper Sunset", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/copper_sunset.webp", isFree: false, isPopular: false, tags: ["copper", "sunset", "warm"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "37", title: "Wildflower", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/wildflower.webp", isFree: true, isPopular: false, tags: ["wildflower", "nature", "free"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "38", title: "Platinum", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/platinum.webp", isFree: false, isPopular: true, tags: ["platinum", "luxury", "premium"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "39", title: "Autumn Leaves", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/autumn_leaves.webp", isFree: false, isPopular: false, tags: ["autumn", "leaves", "fall"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "40", title: "Crystal Clear", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/crystal_clear.webp", isFree: false, isPopular: false, tags: ["crystal", "clear", "pure"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "41", title: "Noir", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/noir.webp", isFree: true, isPopular: true, tags: ["noir", "black", "white", "classic"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "42", title: "Peach Blossom", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/peach_blossom.webp", isFree: false, isPopular: false, tags: ["peach", "blossom", "soft"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "43", title: "Thunder", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/thunder.webp", isFree: false, isPopular: false, tags: ["thunder", "storm", "dramatic"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "44", title: "Pearl", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/pearl.webp", isFree: false, isPopular: true, tags: ["pearl", "elegant", "classic"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "45", title: "Jade", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/jade.webp", isFree: true, isPopular: false, tags: ["jade", "green", "nature"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "46", title: "Ruby", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/ruby.webp", isFree: false, isPopular: false, tags: ["ruby", "red", "passion"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "47", title: "Opal", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/opal.webp", isFree: false, isPopular: true, tags: ["opal", "iridescent", "colorful"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "48", title: "Topaz", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/topaz.webp", isFree: false, isPopular: false, tags: ["topaz", "gold", "warm"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "49", title: "Amethyst", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/amethyst.webp", isFree: true, isPopular: false, tags: ["amethyst", "purple", "mystic"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "50", title: "Garnet", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/garnet.webp", isFree: false, isPopular: false, tags: ["garnet", "deep", "rich"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "51", title: "Citrine", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/citrine.webp", isFree: false, isPopular: true, tags: ["citrine", "yellow", "bright"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "52", title: "Aquamarine", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/aquamarine.webp", isFree: false, isPopular: false, tags: ["aquamarine", "blue", "ocean"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "53", title: "Moonstone", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/moonstone.webp", isFree: true, isPopular: false, tags: ["moonstone", "lunar", "mystical"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "54", title: "Sunstone", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/sunstone.webp", isFree: false, isPopular: false, tags: ["sunstone", "solar", "radiant"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "55", title: "Onyx", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/onyx.webp", isFree: false, isPopular: true, tags: ["onyx", "black", "sleek"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "56", title: "Quartz", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/quartz.webp", isFree: false, isPopular: false, tags: ["quartz", "crystal", "clear"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "57", title: "Turquoise", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/turquoise.webp", isFree: true, isPopular: false, tags: ["turquoise", "teal", "vibrant"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "58", title: "Coral Sunset", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/coral_sunset.webp", isFree: false, isPopular: false, tags: ["coral", "sunset", "warm"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "59", title: "Indigo Night", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/indigo_night.webp", isFree: false, isPopular: true, tags: ["indigo", "night", "deep"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "60", title: "Magenta Dream", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/magenta_dream.webp", isFree: false, isPopular: false, tags: ["magenta", "dream", "vibrant"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "61", title: "Violet Sky", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/violet_sky.webp", isFree: true, isPopular: false, tags: ["violet", "sky", "calm"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "62", title: "Azure", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/azure.webp", isFree: false, isPopular: false, tags: ["azure", "blue", "serene"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "63", title: "Cerise", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/cerise.webp", isFree: false, isPopular: true, tags: ["cerise", "pink", "bold"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "64", title: "Sienna", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/sienna.webp", isFree: false, isPopular: false, tags: ["sienna", "earth", "warm"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "65", title: "Cobalt", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/cobalt.webp", isFree: true, isPopular: false, tags: ["cobalt", "blue", "intense"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "66", title: "Vermilion", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/vermilion.webp", isFree: false, isPopular: false, tags: ["vermilion", "red", "vibrant"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "67", title: "Chartreuse", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/chartreuse.webp", isFree: false, isPopular: true, tags: ["chartreuse", "green", "unique"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "68", title: "Mauve", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/mauve.webp", isFree: false, isPopular: false, tags: ["mauve", "purple", "soft"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "69", title: "Teal Dream", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/teal_dream.webp", isFree: true, isPopular: false, tags: ["teal", "dream", "calm"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "70", title: "Maroon", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/maroon.webp", isFree: false, isPopular: false, tags: ["maroon", "deep", "rich"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "71", title: "Burgundy", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/burgundy.webp", isFree: false, isPopular: true, tags: ["burgundy", "wine", "elegant"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "72", title: "Champagne", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/champagne.webp", isFree: false, isPopular: false, tags: ["champagne", "gold", "celebrate"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "73", title: "Espresso", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/espresso.webp", isFree: true, isPopular: false, tags: ["espresso", "brown", "warm"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "74", title: "Ivory", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/ivory.webp", isFree: false, isPopular: false, tags: ["ivory", "cream", "classic"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "75", title: "Slate", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/slate.webp", isFree: false, isPopular: true, tags: ["slate", "gray", "modern"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "76", title: "Charcoal", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/charcoal.webp", isFree: false, isPopular: false, tags: ["charcoal", "dark", "matte"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "77", title: "Bronze", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/bronze.webp", isFree: true, isPopular: false, tags: ["bronze", "metal", "warm"], videoUrl: "", gradient: gradients[4], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "78", title: "Silver", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/silver.webp", isFree: false, isPopular: false, tags: ["silver", "metal", "shiny"], videoUrl: "", gradient: gradients[5], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "79", title: "Gold", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/gold.webp", isFree: false, isPopular: true, tags: ["gold", "luxury", "premium"], videoUrl: "", gradient: gradients[6], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "80", title: "Rose Gold", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/rose_gold.webp", isFree: false, isPopular: false, tags: ["rose", "gold", "elegant"], videoUrl: "", gradient: gradients[7], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "81", title: "Midnight Blue", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/midnight_blue.webp", isFree: true, isPopular: false, tags: ["midnight", "blue", "deep"], videoUrl: "", gradient: gradients[8], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "82", title: "Forest Green", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/forest_green.webp", isFree: false, isPopular: false, tags: ["forest", "green", "nature"], videoUrl: "", gradient: gradients[9], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "83", title: "Sky Blue", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/sky_blue.webp", isFree: false, isPopular: true, tags: ["sky", "blue", "bright"], videoUrl: "", gradient: gradients[10], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "84", title: "Sunset Orange", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/sunset_orange.webp", isFree: false, isPopular: false, tags: ["sunset", "orange", "warm"], videoUrl: "", gradient: gradients[11], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "85", title: "Candy Pink", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/candy_pink.webp", isFree: true, isPopular: false, tags: ["candy", "pink", "sweet"], videoUrl: "", gradient: gradients[0], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "86", title: "Electric Blue", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/electric_blue.webp", isFree: false, isPopular: false, tags: ["electric", "blue", "vibrant"], videoUrl: "", gradient: gradients[1], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "87", title: "Lime Green", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/lime_green.webp", isFree: false, isPopular: true, tags: ["lime", "green", "fresh"], videoUrl: "", gradient: gradients[2], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
  { id: "88", title: "Hot Pink", thumbnail: "https://lf-storage-pull-zone.b-cdn.net/static/posters/hot_pink.webp", isFree: false, isPopular: false, tags: ["hot", "pink", "bold"], videoUrl: "", gradient: gradients[3], duration: "15s", credits: 30, instructions: ["Upper body photo", "Good lighting", "Facing camera", "Natural pose"], styleId: "i2v-undress-v2" },
];

// ============================================
// Pagination
// ============================================
const ITEMS_PER_PAGE = 12;

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (currentPage > 3) pages.push("...");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

// ============================================
// Discover Page
// ============================================
export default function DiscoverPage() {
  const { settings } = useSettings();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const totalPages = Math.ceil(allTemplates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTemplates = allTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <div className="pt-32 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Discover <span className="text-[#F97316]">Styles</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Choose a style and upload a photo to generate your AI video
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {currentTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isAutoPlay={settings.autoPlayVideos}
              onClick={() => setSelectedTemplate(template)}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {pageNumbers.map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="w-12 h-12 flex items-center justify-center text-white/30 text-sm">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-12 h-12 rounded-xl font-semibold text-sm transition-all ${
                  currentPage === page
                    ? "bg-[#F97316] text-white"
                    : "bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#161827] border border-[#1E2130] text-white/60 hover:text-white hover:border-[#F97316]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      <VideoCreateModal
        isOpen={!!selectedTemplate}
        template={selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.title,
          duration: selectedTemplate.duration,
          credits: selectedTemplate.credits,
          videoUrl: selectedTemplate.videoUrl,
          thumbnailUrl: selectedTemplate.thumbnail,
          instructions: selectedTemplate.instructions,
          gradient: selectedTemplate.gradient,
          styleId: selectedTemplate.styleId,
        } : {
          id: '',
          name: '',
          duration: '',
          credits: 0,
          videoUrl: '',
          thumbnailUrl: '',
          instructions: [],
          gradient: '',
          styleId: '',
        }}
        onClose={() => setSelectedTemplate(null)}
        onOpenLogin={() => { setSelectedTemplate(null); setLoginOpen(true); }}
        onOpenPayment={() => { setSelectedTemplate(null); setPaymentOpen(true); }}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </div>
  );
}
