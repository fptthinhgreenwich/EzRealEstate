-- Clear all chat related data
DELETE FROM chat_messages;
DELETE FROM conversations;

-- Reset auto-increment if needed (for SQL Server)
-- DBCC CHECKIDENT ('chat_messages', RESEED, 0);
-- DBCC CHECKIDENT ('conversations', RESEED, 0);

SELECT 'Chat data cleared successfully' as result;