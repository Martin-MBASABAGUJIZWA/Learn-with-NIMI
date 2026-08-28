-- Raise storyBook bucket file size limit to 2 GB to support large video uploads
-- (destination videos, weekly challenges, bonus videos can exceed the previous default)
UPDATE storage.buckets
SET file_size_limit = 2147483648  -- 2 GB in bytes
WHERE id = 'storyBook';
