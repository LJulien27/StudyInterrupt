// Importing necessary libraries and components
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import OopsModal from '../Default/OopsModal';
import { Session } from "../../types/Sessions";
import { Contest } from "../../types/Contests";
import { useAuth } from "../../AuthContext";

// Functional component to display session and contest history
const History: React.FC = () => {
  const { user } = useAuth();
  // State to manage the error modal visibility
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  // State to store error messages
  const [errorMessage, setErrorMessage] = useState('');
  // State to store session data
  const [sessions, setSessions] = useState<Session[]>([]);
  // State to store contest data
  const [contests, setContests] = useState<Contest[]>([]);

  // Fetch session and contest data when the component mounts
  useEffect(() => {
    if (!user || (!user._id && !user.id)) return;
    
    const userId = (user as any)._id || user.id;
    const fetchData = async () => {
      try {
        // Fetching session data from the backend
        const sessionResponse = await axios.get(`https://studyinterruptbackend.onrender.com/users/${userId}/sessions`);
        console.log("Sessions response:", sessionResponse.data);
        // Updating the sessions state with the fetched data
        setSessions(Array.isArray(sessionResponse.data.sessions) ? sessionResponse.data.sessions : []);
      } catch (error) {
        console.error("Error loading sessions: ", error);
        // Displaying an error message in the modal
        setErrorMessage(`Error: ${error || 'An unknown error occurred.'}`);
        setIsErrorModalOpen(true);
      }

      try {
        // Fetching contest data from the backend
        const contestResponse = await axios.get(`https://studyinterruptbackend.onrender.com/users/${userId}/contests`);
        console.log("Contests response:", contestResponse.data);
        // Updating the contests state with the fetched data
        setContests(Array.isArray(contestResponse.data.contests) ? contestResponse.data.contests : []);
      } catch (error) {
        console.error("Error loading contests: ", error);
        // Displaying an error message in the modal
        setErrorMessage(`Error: ${error || 'An unknown error occurred.'}`);
        setIsErrorModalOpen(true);
      }
    };

    fetchData(); // Call the fetchData function
  }, [user]); // Run when user changes

  return (
    <div>
      {/* Page title */}
      <h1>Session and Contest History</h1>

      {/* Table to display session and contest data */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Participants</th>
            <th>Quiz ID</th>
            <th>Contest Details</th>
          </tr>
        </thead>
        <tbody>
          {/* Mapping over sessions to display each session's details */}
          {sessions.map((session, index) => {
            // Finding the contest associated with the current session
            const associatedContest = contests.find(contest => contest.session_id === session._id);
            return (
              <tr key={index}>
                {/* Displaying session start and end times */}
                <td>{new Date(session.start_time).toLocaleString()}</td>
                <td>{new Date(session.end_time).toLocaleString()}</td>
                {/* Displaying session participants */}
                <td>{session.participants?.map(p => p.username).join(", ") || "No participants"}</td>
                {/* Displaying the quiz ID */}
                <td>{session.quiz_id || "N/A"}</td>
                {/* Displaying contest details if associated with the session */}
                <td>
                  {associatedContest ? (
                    <div>
                      <strong>Grades:</strong> {associatedContest.grades?.join(", ") || "N/A"} <br/>
                      <strong>Contest Participants:</strong> {associatedContest.participants?.map(p => p.username).join(", ") || "No participants"}
                    </div>
                  ) : (
                    "No Contest"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Error modal to display any errors that occur during data fetching */}
      <OopsModal
        show={isErrorModalOpen}
        onHide={() => setIsErrorModalOpen(false)}
        errorMessage={errorMessage}
      />
    </div>
  );
};

// Exporting the History component for use in other parts of the application
export default History;