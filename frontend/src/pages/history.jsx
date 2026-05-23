import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton, Stack } from '@mui/material';

export default function History() {
    const { getUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getUserHistory();
                setMeetings(history);
            } catch {
                // failed to load history
            }
        }
        fetchHistory();
    }, [getUserHistory])

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    return (
        <div className="historyPage">
            <div className="historyHeader">
                <IconButton onClick={() => routeTo("/home")}> <HomeIcon /> </IconButton>
                <Typography variant="h5">Meeting History</Typography>
            </div>

            {meetings.length > 0 ? (
                <Stack spacing={2} sx={{ mt: 3 }}>
                    {meetings.map((entry, index) => (
                        <Card key={index} variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Meeting code
                                </Typography>
                                <Typography variant="h6">{entry.meetingCode}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Joined on {formatDate(entry.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            ) : (
                <Typography variant="body1" sx={{ mt: 4, color: '#555' }}>
                    No recent meetings found. Create or join a meeting to build your history.
                </Typography>
            )}
        </div>
    )
}
