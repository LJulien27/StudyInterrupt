import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import OopsModal from '../Default/OopsModal';
import { Session } from "../../types/Sessions";
import { Contest } from "../../types/Contests";
import * as S from "./History.styled";


const History = () => {
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await axios.get('http://localhost:8000/users/67d4aafda97b4f67f45759bf/sessions');
        console.log("Sessions response:", sessionResponse.data);
        setSessions(Array.isArray(sessionResponse.data.sessions) ? sessionResponse.data.sessions : []);
      } catch (error) {
        console.error("Error loading sessions: ", error);
        setErrorMessage(`Error: ${error || 'An unknown error occurred.'}`);
        setIsErrorModalOpen(true);
      }

      try {
        const contestResponse = await axios.get('http://localhost:8000/users/67d4aafda97b4f67f45759bf/contests');
        console.log("Contests response:", contestResponse.data);
        setContests(Array.isArray(contestResponse.data.contests) ? contestResponse.data.contests : []);
      } catch (error) {
        console.error("Error loading contests: ", error);
        setErrorMessage(`Error: ${error || 'An unknown error occurred.'}`);
        setIsErrorModalOpen(true);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-4">
      <h1>Session and Contest History</h1>
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
          {sessions.map((session, index) => {
            const associatedContest = contests.find(contest => contest.session_id === session._id);
            return (
              <tr key={index}>
                <td>{new Date(session.start_time).toLocaleString()}</td>
                <td>{new Date(session.end_time).toLocaleString()}</td>
                <td>{session.participants?.map(p => p.username).join(", ") || "No participants"}</td>
                <td>{session.quiz_id || "N/A"}</td>
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

      <OopsModal
        show={isErrorModalOpen}
        onHide={() => setIsErrorModalOpen(false)}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export default History;