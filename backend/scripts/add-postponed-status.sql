-- Migration: Add 'postponed' status to todos table
-- Run this once on your existing database

ALTER TABLE todos
  MODIFY COLUMN status ENUM('pending', 'in_progress', 'postponed', 'done') DEFAULT 'pending';
