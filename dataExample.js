// Appointment statuses PENDING, CONFIRMED, DONE
const appointment_a = {
    "appointmentId": "1",
    "clientId": "1",
    "scheduledStart" : "2019-08-24T14:15:22Z",
    "scheduledEnd" : "2019-08-24T16:15:22Z",
    "status": "PENDING",

    "serviceOrders" : [
        {
            "serviceOrderId": "1",
            "type": "maintenance",
            "frequency": "monthly",
            "assetId": "1"
        }
    ]
};

//Finding statuses OPENED CLOSED
const finding_a = {
    "status": "OPENED",
    "assetId": "1",
    "severity": "CRITICAL",
    "reportDate": "2019-08-24T16:15:22Z",
    "closedDate": "2019-08-25T16:15:22Z"
}