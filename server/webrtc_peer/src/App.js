import React from 'react';
import { Typography, AppBar } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import VideoPlayer from './components/VideoPlayer';
import Notifications from './components/Notifications';
import Sidebar from './components/Sidebar';


const App = () => {
    const { classes } = useStyles();

    return (
        <div className={classes.wrapper}>
            <AppBar className={classes.appBar} position="static" color="inherit">
                <Typography variant="h4" align="center">WEBRTC Prototype</Typography>   
            </AppBar>
            <VideoPlayer />
            <Sidebar>
                <Notifications /> 
            </Sidebar> 
        </div>
    );
}

const useStyles = makeStyles({ "name": { App } })((theme) => ({

    "appBar": {
        borderRadius: 15,
        margin: '30px 100px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '600px',
        border: '2px solid black',

        [theme.breakpoints.down('xs')]: {
        width: '90%',
        },
    },
    "image": {
        marginLeft: '15px',
    },
    "wrapper": {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
    },

}));


export default App;