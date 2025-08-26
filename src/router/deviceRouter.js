const express = require('express');
const router = express.Router();

const deviceController = require('../modules/deviceController')

router.post('/device', deviceController.createDevice)
router.get('/device', deviceController.getDevices)
router.delete('/device/:deviceID', deviceController.deleteDeviceByID)

module.exports = router;
