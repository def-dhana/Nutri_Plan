/*
  # Create NutriPlan Database Schema

  ## Overview
  This migration creates the database structure for the NutriPlan application,
  a daily meal planning web app.

  ## New Tables
  
  ### `food_items`
  Stores all food/menu items with their nutritional information
  - `id` (uuid, primary key) - Unique identifier for each food item
  - `name` (text) - Name of the food item (e.g., "Nasi Putih", "Ayam Goreng")
  - `meal_type` (text) - Category: 'breakfast', 'lunch', 'dinner', 'snack'
  - `calories` (integer) - Calories per serving
  - `protein` (decimal) - Protein in grams
  - `carbs` (decimal) - Carbohydrates in grams
  - `fat` (decimal) - Fat in grams
  - `serving_size` (text) - Description of serving size (e.g., "1 porsi", "100g")
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on `food_items` table
  - Add policy for public read access (food items are reference data)
  - Only authenticated users can insert/update/delete (for future admin features)
*/

CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories integer NOT NULL,
  protein decimal(10,2) NOT NULL DEFAULT 0,
  carbs decimal(10,2) NOT NULL DEFAULT 0,
  fat decimal(10,2) NOT NULL DEFAULT 0,
  serving_size text NOT NULL DEFAULT '1 porsi',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view food items"
  ON food_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert food items"
  ON food_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update food items"
  ON food_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete food items"
  ON food_items FOR DELETE
  TO authenticated
  USING (true);