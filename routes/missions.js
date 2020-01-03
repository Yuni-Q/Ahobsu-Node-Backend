const express = require('express');
const sequelize = require('sequelize');
const moment = require('moment');

const db = require('../models');
const checkToken = require('../lib/checkToken');
const response = require('../lib/response');

const router = express.Router();

/* GET users listing. */
router.get('/', checkToken, async (req, res, next) => {
  const { id } = req.user;
  const user = await db.sequelize.findOne({
    where: {
      id,
    },
  });
  const date = moment()
    .tz('Asia/Seoul')
    .format('YYYY-MM-DD');
  let mission = JSON.parse(user.mission);
  if (mission.date < date) {
    const sql = 'SELECT * from chocopie.missions ORDER BY RAND() LIMIT 3';
    const mission = await db.sequelize.query(sql, {
      type: sequelize.QueryTypes.SELECT,
    });
    await db.users.update(
      { mission: JSON.stringify({ date, mission }) },
      {
        where: {
          id,
        },
      },
    );
    res.json(response({ date: mission }));
  } else {
    res.json(response({ date: mission }));
  }
});

router.post('/', async (req, res, next) => {
  const { title, isContent, isImage } = req.body;
  const missions = await db.missions.create({ title, isContent, isImage });
  res.json({ missions });
});

router.put('/:id', async (req, res, next) => {
  const { title, isContent, isImage } = req.body;
  const id = parseInt(req.params.id, 10);
  const mission = await db.missions.findOne({ where: { id } });
  console.log(111, mission);
  if (!!mission) {
    await db.missions.update(
      { title: title, isContent: isContent, isImage: isImage },
      {
        where: {
          id,
        },
      },
    );
    const newMission = await db.missions.findOne({ where: { id } });
    return res.json({ mission: newMission });
  }
  res.json({ message: '유효하지 않은 mission id 입니다.' });
});

router.delete('/:id', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const mission = await db.missions.findOne({
    where: {
      id,
    },
  });
  if (!!mission) {
    const missions = await db.missions.destroy({
      where: {
        id,
      },
    });
    return res.json({ message: '문제를 삭제 했습니다.' });
  }
  res.json({ message: '유효하지 않은 mission id 입니다.' });
});

router.post('/refresh', checkToken, async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.json(response({ status: 412, messgae: 'id가 올바르지 않습니다.' }));
  }
  try {
    const user = await db.users.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      return res.json(response({ status: 404, message: '유저가 존재하지 없습니다.' }));
    }
    const date = await moment()
      .tz('Asia/Seoul')
      .format('YYYY-MM-DD');
    if (!user.refreshDate && user.refreshDate < date) {
      const { id } = req.user;
      const sql = 'SELECT * from chocopie.missions ORDER BY RAND() LIMIT 3';
      const mission = await db.sequelize.query(sql, {
        type: sequelize.QueryTypes.SELECT,
      });
      await db.users.update(
        { refreshDate: date, mission: JSON.stringify(date, mission) },
        {
          where: {
            id,
          },
        },
      );
      res.json(response({ data: mission }));
    } else {
      res.json(response({ status: 400, messgae: '갱신 횟수가 모자랄 수 있습니다.' }));
    }
  } catch (e) {
    console.log(e);
    res.json(response({ status: 500, messgae: e.message }));
  }
});

module.exports = router;
