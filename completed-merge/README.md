Left the backend inside.
Not sure if we should delete it. (Probably doesn't work with current frontend code)
We'll decide later :D

UPDATE 26.05:
- Decided to leave in backend folder for ease of setup during group meets, testing, work on the project or presentation.
- Option to host Express backend server on other device still possible, although with slight changes to the code (ask Gosho)


UPDATE 01.06:
- Major revamp to Ticket page functionality and style:
    - Revamp to visuals of the page to match set theme by the main page
    - Functionalities regarding the possible changes to the ticket are optimised to better represent actual issue tracker systems
    - Revamp to the comments section for better usability
    - Added the option to change the title and description of the ticket
      
- Readded and fixed Notification system:
    - Notifications are checked every 15 seconds
    - Almost if not all changes and comments made to an issue ticket is sent as a notification to the creator of the ticket AND the current assignee
    - All notifications have the standard functionalities of notifications on other platforms such as delete, read, mark all as read and are clickable
    - Notifications are synced saved in the database due to the nature and size of the project. (For bigger project, having 500K+ notifs in a table in the DB isn't the best and most optimal option afaik :D )

- Changed to the main page that include:
    - Hid the sidebar due to almost no point of it being there besides looking nice with the smooth animation
    - Minor changes of the behaviour of the issues container
    - Updated and uniformed time format
  
  * There is a test functionality left in the new issue modal, where after adding a new issue a notification was sent to the current user. This was used for testing the notifications system while it was being developed, but it was left in the code. It *could* be deleted later on, for now it stays.

- Login page changes:
    - Visual made to match main page design
    - Redesign of the possible error messages
    - Code clean up left behind from debugging

- TO-DO:
    - Rethink the logic behind the deletion of the issue. An idea of archiving the issue, instead of deleting it from the DB was proposed. This might require DB modifications and possible new table for Issues, but will be discussed with the team again
    - Do some more user testing to find possible edge cases and possible missing elements or functionalities
    - Perhaps add more functionality, after confirming the stability of the current progress
