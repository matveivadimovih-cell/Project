import { useEffect, useState } from "react";
import { loggerEmitter, getLogs, } from "../core/decorators.js";

const colors = {
    'DEBUG': 'green',
    'INFO': 'blue',
    'WARN': 'orange',
    'ERROR': 'red'
}

export default function LogConsole()
{
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        setLogs(getLogs());

        const unsubscribe = loggerEmitter.on('logAdded', 
            (newLog) => {
                setLogs((prevLogs) => {
                    const updatedLogs = [...prevLogs, newLog];
                    
                    if (updatedLogs.length > 100) 
                    {
                        updatedLogs.shift();
                    }

                    return updatedLogs;
                });
            });

        return () => {
        unsubscribe();
        };
    }, []);

    const consoleStyle = {
        backgroundColor: 'black',
        color: 'white',
        padding: '10px',
        fontFamily: 'monospace'
    };

    return (
        <div style={consoleStyle}>
            <div style = {{ color: 'green', fontWeight: 'bold', marginBottom: '10px' }}>
                System Logs Task 9
            </div>
            {logs.map((log, index) => (
                <div key = {index} style={{ color: colors[log.logLevel] || 'white' }}>
                    [{new Date(log.timestamp).toLocaleString()}] [{log.logLevel}] [{log.functionName}]{log.message}
                </div>
            ))}
        </div>
    )
}