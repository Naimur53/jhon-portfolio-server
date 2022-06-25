const express = require('express')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const cors = require('cors');
const mongoose = require('mongoose');
const categories = require('./models/category');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const blog = require('./models/blog');
const user = require('./models/user');
const { updateMany } = require('./models/blog');
const nodemailer = require("nodemailer");
// cloudinary config 
cloudinary.config({
    cloud_name: 'dvor8fuxv',
    api_key: '162697393682668',
    api_secret: 'q3XbKDfcKDn7DCHRZdRfdH_tjl4',
    secure: true
});
//middle
app.use(cors())
app.use(express.json());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

const uri = "mongodb+srv://learning-database:n4Jecc0URZJL35YK@cluster0.icikx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(uri, () => {
    console.log('connect')
}, e => console.log(e))

async function run() {
    try {
        app.get('/category', async (req, res) => {
            const { short } = req.query;
            console.log(short);
            let result;
            if (short) {

                result = await categories.find({}).select('_id thumbnail categoryName title description').limit(20)

            }
            else {
                result = await categories.find({})

            }
            res.json(result);
        })
        app.post('/category', async (req, res) => {
            const result = await categories.create(req.body)

            res.json(result);
        })
        app.get('/blog', async (req, res) => {
            // const result = await categories.create(req.body)
            try {

                const { id, short } = req.query
                console.log(id);
                let result;
                if (id) {

                    result = await blog.findById(id)
                } else if (short) {
                    result = await blog.find({}).select('heading description img address date').limit(10);
                }
                else {
                    result = await blog.find({}).select('comments love heading description img address date');
                }
                res.json(result);
            }
            catch (e) {
                res.status(400).json({ error: 'bad req' })
            }
        })
        app.get('/blog/recent', async (req, res) => {
            // const result = await categories.create(req.body)
            try {

                const result = await blog.find({}).sort({ _id: -1 }).limit(4)
                res.json(result);
            }
            catch (e) {
                console.log(e);
                res.status(400).json({ error: 'bad req' })
            }
        })
        app.get('/blog/mostLoved', async (req, res) => {
            // const result = await categories.create(req.body)
            try {

                const result = await blog.aggregate([
                    { $unwind: "$love" },
                    {
                        $group: {
                            _id: "$_id",
                            heading: { "$first": "$heading" },
                            img: { "$first": "$img" },
                            address: { "$first": "$address" },
                            date: { "$first": "$date" },
                            len: { $sum: 1 }
                        }
                    },
                    { $sort: { len: -1 } },
                    { $limit: 3 }
                ])
                res.json(result);
            }
            catch (e) {
                console.log(e);
                res.status(400).json({ error: 'bad req' })
            }
        })
        app.post('/blog', async (req, res) => {
            // const result = await categories.create(req.body)
            const createBlog = new blog(req.body);
            const result = await createBlog.save();
            console.log(result, 'res');
            res.json({ result });
        })

        app.put('/blog/comment', async (req, res) => {
            // const result = await categories.create(req.body)
            const { id } = req.query;
            console.log(req.body);
            let result;
            try {
                if (id) {
                    const thatBlog = await blog.findById(id);
                    const response = await thatBlog.comments.push(req.body)
                    const rs = await thatBlog.save()
                    res.json({ result: 'success' });
                }
            } catch (e) {
                console.log(e);
                res.status(400).json({ error: 'something bd' })
            }


        });

        app.get('/blog/comment/recent', async (req, res) => {
            // const result = await categories.create(req.body)
            try {

                const result = await blog.aggregate([
                    { $unwind: "$comments" },
                    {
                        $group: {
                            _id: "$_id",
                            comments: { "$first": "$comments" },
                            len: { $sum: 1 }
                        }
                    },
                    { $sort: { time: -1 } },
                    { $limit: 3 }
                ])

                res.json(result);
            }
            catch (e) {
                console.log(e);
                res.status(400).json({ error: e.message })
            }
        })
        app.put('/blog/love', async (req, res) => {

            const { id } = req.query;
            const data = req.body;
            let result;

            try {
                if (id) {
                    const thatBlog = await blog.findById(id);
                    const res = await thatBlog.love.push(data)
                    const rs = await thatBlog.save()
                    res.json(rs);
                }
            } catch (e) {
                console.log(e);
                res.status(400).json({ error: 'something bd' })
            }


        })
        //delete blog 
        app.delete('/blog/delete', async (req, res) => {
            // const result = await categories.create(req.body)
            const { id } = req.query;
            console.log(id, 'iddd');
            try {
                if (id) {
                    const result = await blog.findByIdAndDelete(id);
                    console.log(result);
                    res.json(result);
                }
            } catch (e) {
                console.log(e);
                res.status(400).json({ error: 'something bd' })
            }


        });
        app.get('/user', async (req, res) => {
            const allUser = await user.find({});
            res.json(allUser)

        })

        app.put('/user', async (req, res) => {
            const data = req.body;
            console.log(data);
            const filter = { email: data.email };
            const options = { upsert: true }
            const updateDoc = { $set: data }
            const result = await user.updateOne(filter, updateDoc, options);
            console.log(result);
            res.json(result);

        })
        app.post('/sendMail', async (req, res) => {

            try {
                const { displayName, email, comment, subject } = req.body;
                console.log({ displayName, subject, email, comment });
                // create reusable transporter object using the default SMTP transport
                const transport = await nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: "naimurrhman53@gmail.com",
                        pass: "effyzuelazwgppnz"
                    }
                });
                // send mail with defined transport object
                const mailOptions = {
                    from: email,
                    to: 'naimurrhman53@gmail.com',
                    subject: subject,
                    text: comment
                }
                await transport.sendMail(mailOptions, function (error, response) {
                    if (error) {

                        res.status(400).json({ res: 'error' })
                    } else {
                        res.send("Email has been sent successfully");
                        console.log('mail sent');
                        res.json({ res: 'success' })
                    }
                })
            } catch (err) {

            }

        })


        app.get('/singleCategory', async (req, res) => {
            try {

                const id = req.query.id
                console.log(id);
                const result = await categories.findById(id)
                console.log(result, 'res');
                res.json(result);
            }
            catch (e) {
                res.status(400).json({ error: 'bad req' })
            }
        })
        app.delete('/category', async (req, res) => {
            try {
                const id = req.query.id
                console.log(id);
                const result = await categories.findById(id);
                res.json({});
            }
            catch (e) {
                res.status(400).json({ error: 'bad req' })
            }
        })
        app.get('/uniqCategory', async (req, res) => {
            try {

                const result = await categories.distinct("categoryName")
                console.log(result, 'res');
                res.json(result);
            }
            catch (e) {
                res.status(400).json({ error: 'bad req' })
            }
        })

        app.post('/video', async (req, res) => {
            console.log('the file', req.files.video);
            const file = req.files?.video;
            let url;
            if (file) {

                await cloudinary.uploader.upload(file.tempFilePath,
                    {
                        resource_type: "video", public_id: "myfolder/mysubfolder/" + file.name.split('.')[0],
                        overwrite: true,
                    },
                    function (error, result) {
                        if (result) {
                            url = result.url
                        }
                        console.log(result, error)
                    });
            }


            res.json({ url })
        })
    }
    catch (e) {

    }
}


run().catch(console.dir);
// default 
app.get('/', async (req, res) => {
    res.send('server is runing  ');
})
app.listen(port, () => {
    console.log('server is running at port', port);
})



const data = [
    { "_id": "62ab50899db371b54eb59e32", "thumbnail": "https://i.ibb.co/Y2V8PK7/20190314-WEST-AFRICA-FROM-GUNJUR-TO-BASSE-0814.jpg", "categoryName": "WEST AFRICA", "title": "YOU DON’T TAKE A PHOTOGRAPH, YOU CREATE IT.", "description": "Taking a photo is almost stealing. Creating a photo is the process between photographer and his environment. Modest and with respect.", "photos": ["https://i.ibb.co/W2MHbNw/West-africa008.jpg", "https://i.ibb.co/DbPW9BL/West-africa009.jpg", "https://i.ibb.co/Pw8vRVL/West-africa010.jpg", "https://i.ibb.co/f4sR0Rs/West-africa011.jpg", "https://i.ibb.co/WD5VHmx/West-africa012.jpg", "https://i.ibb.co/zP5twt5/West-africa013.jpg", "https://i.ibb.co/9Y3tydH/West-africa014.jpg", "https://i.ibb.co/5k1bqkV/West-africa015.jpg", "https://i.ibb.co/1LjJtHr/West-africa016.jpg", "https://i.ibb.co/dMbGGwj/West-africa017.jpg", "https://i.ibb.co/yd1GKwm/West-africa018.jpg", "https://i.ibb.co/ZM7PmKV/West-africa019.jpg", "https://i.ibb.co/Jj19Jb1/West-africa020.jpg", "https://i.ibb.co/k9jxRVY/West-africa021.jpg", "https://i.ibb.co/B6QNMKT/West-africa022.jpg", "https://i.ibb.co/SXLRq67/West-africa023.jpg", "https://i.ibb.co/XL228cB/West-africa024.jpg", "https://i.ibb.co/yqG5ts8/West-africa025.jpg", "https://i.ibb.co/kQCvHq7/West-africa026.jpg", "https://i.ibb.co/d05wjhS/West-africa027.jpg", "https://i.ibb.co/r3v1Zps/West-africa028.jpg", "https://i.ibb.co/x2nDD3V/West-africa029.jpg", "https://i.ibb.co/wSFcqWg/West-africa030.jpg", "https://i.ibb.co/9pdH6ch/West-africa031.jpg", "https://i.ibb.co/qCz291d/West-africa032.jpg", "https://i.ibb.co/GWBK298/West-africa033.jpg", "https://i.ibb.co/xq9Z41z/West-africa034.jpg", "https://i.ibb.co/FJZTx5N/West-africa035.jpg", "https://i.ibb.co/9Gv2hNV/West-africa036.jpg", "https://i.ibb.co/p2m8qxq/West-africa037.jpg", "https://i.ibb.co/pyNRDS7/West-africa038.jpg", "https://i.ibb.co/tw6Jr27/West-africa039.jpg", "https://i.ibb.co/L552yt9/West-africa040.jpg", "https://i.ibb.co/gZxTYjG/West-africa041.jpg", "https://i.ibb.co/djn58MQ/West-africa042.jpg", "https://i.ibb.co/82H75Ky/West-africa043.jpg", "https://i.ibb.co/NLbV08F/West-africa044.jpg", "https://i.ibb.co/W5n2Xg0/West-africa045.jpg", "https://i.ibb.co/SsvXSPk/West-africa046.jpg", "https://i.ibb.co/16ZThcD/West-africa047.jpg", "https://i.ibb.co/Z22q1Vm/West-africa048.jpg", "https://i.ibb.co/br72Cf2/West-africa049.jpg", "https://i.ibb.co/9nY33jz/West-africa050.jpg", "https://i.ibb.co/K7HCfSh/West-africa051.jpg", "https://i.ibb.co/CV5t8PS/West-africa052.jpg", "https://i.ibb.co/qxkfK9Z/West-africa053.jpg", "https://i.ibb.co/pnm89jt/West-africa054.jpg", "https://i.ibb.co/3yQCHZG/West-africa055.jpg", "https://i.ibb.co/NSN7z31/West-africa056.jpg", "https://i.ibb.co/XYKFs93/West-africa057.jpg", "https://i.ibb.co/1J2FVkV/West-africa058.jpg", "https://i.ibb.co/LRFHvH8/West-africa059.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e33", "thumbnail": "https://i.ibb.co/ncCZrKN/20180927-BOSNIE-LUKOMIR-488.jpg", "categoryName": "LUKOMIR - BOSNIA", "title": "YOU DON’T TAKE A PHOTOGRAPH, YOU MAKE IT", "description": "LOST VILLAGE OR SAVED TREASURE", "photos": ["https://i.ibb.co/bNdmzs3/20180927-BOSNIE-LUKOMIR-006-1.jpg", "https://i.ibb.co/VgtTBQx/20180927-BOSNIE-LUKOMIR-061.jpg", "https://i.ibb.co/bsk1B7D/20180927-BOSNIE-LUKOMIR-078.jpg", "https://i.ibb.co/m9qKBBp/20180927-BOSNIE-LUKOMIR-091.jpg", "https://i.ibb.co/rbCbzxB/20180927-BOSNIE-LUKOMIR-149.jpg", "https://i.ibb.co/xjqtYWN/20180927-BOSNIE-LUKOMIR-169.jpg", "https://i.ibb.co/PChBgZG/20180927-BOSNIE-LUKOMIR-173.jpg", "https://i.ibb.co/b3PrLs7/20180927-BOSNIE-LUKOMIR-195.jpg", "https://i.ibb.co/SvnT8yj/20180927-BOSNIE-LUKOMIR-209.jpg", "https://i.ibb.co/Kh0dgcT/20180927-BOSNIE-LUKOMIR-235.jpg", "https://i.ibb.co/9sKKXPj/20180927-BOSNIE-LUKOMIR-238.jpg", "https://i.ibb.co/PF2mQ8f/20180927-BOSNIE-LUKOMIR-241.jpg", "https://i.ibb.co/kMzZ679/20180927-BOSNIE-LUKOMIR-271.jpg", "https://i.ibb.co/G5xDRbg/20180927-BOSNIE-LUKOMIR-273.jpg", "https://i.ibb.co/g7j6Zzm/20180927-BOSNIE-LUKOMIR-282.jpg", "https://i.ibb.co/fn2CQsg/20180927-BOSNIE-LUKOMIR-286.jpg", "https://i.ibb.co/64Px0Cb/20180927-BOSNIE-LUKOMIR-355.jpg", "https://i.ibb.co/NYbP1bC/20180927-BOSNIE-LUKOMIR-413.jpg", "https://i.ibb.co/TRcsyfS/20180927-BOSNIE-LUKOMIR-429.jpg", "https://i.ibb.co/3kg7QwM/20180927-BOSNIE-LUKOMIR-488-1.jpg", "https://i.ibb.co/CQrkJ5h/20180927-BOSNIE-LUKOMIR-488.jpg", "https://i.ibb.co/QjNgQxh/20180928-BOSNIE-LUKOMIR-548.jpg", "https://i.ibb.co/NLDG0GP/20180928-BOSNIE-LUKOMIR-561.jpg", "https://i.ibb.co/k5WkDKJ/20180928-BOSNIE-LUKOMIR-569.jpg", "https://i.ibb.co/VM6fvKn/20180928-BOSNIE-LUKOMIR-574.jpg", "https://i.ibb.co/hycnmw4/20180928-BOSNIE-LUKOMIR-580.jpg", "https://i.ibb.co/sqWxvY9/20180928-BOSNIE-LUKOMIR-589.jpg", "https://i.ibb.co/9pd6Kxx/20180928-BOSNIE-LUKOMIR-606.jpg", "https://i.ibb.co/D5mb5NL/20180928-BOSNIE-LUKOMIR-609.jpg", "https://i.ibb.co/f4dcv90/20180928-BOSNIE-LUKOMIR-628.jpg", "https://i.ibb.co/VJFNygm/20180928-BOSNIE-LUKOMIR-630.jpg", "https://i.ibb.co/NpVP6nS/20180928-BOSNIE-LUKOMIR-635.jpg", "https://i.ibb.co/0qJgVtr/20180928-BOSNIE-LUKOMIR-658.jpg", "https://i.ibb.co/LdsXhJX/20180928-BOSNIE-LUKOMIR-717.jpg", "https://i.ibb.co/V2j0f3X/20180928-BOSNIE-LUKOMIR-752.jpg", "https://i.ibb.co/5sr8Fks/20180928-BOSNIE-LUKOMIR-758.jpg", "https://i.ibb.co/1R3R3GB/20180928-BOSNIE-LUKOMIR-763.jpg", "https://i.ibb.co/rwhhxkg/20180928-BOSNIE-LUKOMIR-774.jpg", "https://i.ibb.co/CKyfLWQ/20180928-BOSNIE-LUKOMIR-813.jpg", "https://i.ibb.co/NxZdDhF/20180928-BOSNIE-LUKOMIR-815.jpg", "https://i.ibb.co/RhFtvB5/20180928-BOSNIE-LUKOMIR-823.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e34", "thumbnail": "https://i.ibb.co/fNd8WFn/20180808-BOSNIA-HERZEGOVINA-MOSTAR-STARI-MOST-056-1.jpg", "categoryName": "MOSTAR - HERZEGOVINA", "title": "YOU DON’T TAKE A PHOTOGRAPH, YOU CREATE IT.", "description": "Taking a photo is almost stealing. Creating a photo is the process between photographer and his environment. Modest and with respect.", "photos": ["https://i.ibb.co/XFYsStP/20180807-BOSNIA-HERZEGOVINA-MOSTAR-DIVER-017.jpg", "https://i.ibb.co/zf2x8MM/20180807-BOSNIA-HERZEGOVINA-MOSTAR-DIVER-100.jpg", "https://i.ibb.co/VpF3pc2/20180807-BOSNIA-HERZEGOVINA-MOSTAR-DIVER-103.jpg", "https://i.ibb.co/7Srrd2J/20180807-BOSNIA-HERZEGOVINA-MOSTAR-DIVER-162.jpg", "https://i.ibb.co/JjfRJ8w/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-001.jpg", "https://i.ibb.co/Tb9KkXh/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-002.jpg", "https://i.ibb.co/16LsnQ9/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-010.jpg", "https://i.ibb.co/0tM3CcQ/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-014.jpg", "https://i.ibb.co/Jkn6Fkr/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-016.jpg", "https://i.ibb.co/XpKr6q3/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-017.jpg", "https://i.ibb.co/fXm6zWZ/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-021.jpg", "https://i.ibb.co/jrkfhrh/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-029.jpg", "https://i.ibb.co/gJB7vPw/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-032.jpg", "https://i.ibb.co/6t4z5Gm/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-034.jpg", "https://i.ibb.co/3zdGwfZ/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-038.jpg", "https://i.ibb.co/1KtQf9H/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-046.jpg", "https://i.ibb.co/fSmZqdD/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-054.jpg", "https://i.ibb.co/C15pzVW/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-056.jpg", "https://i.ibb.co/TH02QZ8/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-060.jpg", "https://i.ibb.co/Tv2jJYB/20180807-BOSNIE-MOSTAR-TURKISCH-COFFEE-002-1.jpg", "https://i.ibb.co/NYKd4rs/20180807-BOSNIE-MOSTAR-TURKISCH-COFFEE-004-1.jpg", "https://i.ibb.co/FwWm55p/20180807-BOSNIE-MOSTAR-TURKISCH-COFFEE-008-1.jpg", "https://i.ibb.co/6WTRQrj/20180808-BOSNIA-HERZEGOVINA-MOSTAR-CRAFT-WORKER-004.jpg", "https://i.ibb.co/hDZ8kKD/20180808-BOSNIA-HERZEGOVINA-MOSTAR-CRAFT-WORKER-022.jpg", "https://i.ibb.co/0jnzNvb/20180808-BOSNIA-HERZEGOVINA-MOSTAR-CRAFT-WORKER-042.jpg", "https://i.ibb.co/G0RfsGK/20180808-BOSNIA-HERZEGOVINA-MOSTAR-STARI-MOST-025.jpg", "https://i.ibb.co/fNd8WFn/20180808-BOSNIA-HERZEGOVINA-MOSTAR-STARI-MOST-056-1.jpg", "https://i.ibb.co/fNd8WFn/20180808-BOSNIA-HERZEGOVINA-MOSTAR-STARI-MOST-056-1.jpg", "https://i.ibb.co/L68vkrf/20180809-BOSNIA-HERZEGOVINA-MOSTAR-CRAFT-WORKER-02-005.jpg", "https://i.ibb.co/8bXrXM2/20180809-BOSNIA-HERZEGOVINA-MOSTAR-CRAFT-WORKER-02-027.jpg", "https://i.ibb.co/ZKCh5xb/20180809-BOSNIA-HERZEGOVINA-MOSTAR-CRAFT-WORKER-02-034.jpg", "https://i.ibb.co/xsGTf7T/20180809-BOSNIA-HERZEGOVINA-MOSTAR-STARI-MOST-065.jpg", "https://i.ibb.co/4KgyrTH/20180927-BOSNIE-LUKOMIR-006-1.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e35", "thumbnail": "https://i.ibb.co/jyBB6SX/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-079-1.jpg", "categoryName": "MONTENEGRO", "title": "YOU DON’T TAKE A PHOTOGRAPH, YOU CREATE IT.", "description": "Taking a photo is almost stealing. Creating a photo is the process between photographer and his environment. Modest and with respect.", "photos": ["https://i.ibb.co/54Qh2DV/20180802-MONTENEGRO-BRANDZOV-001.jpg", "https://i.ibb.co/tHV9t0j/20180802-MONTENEGRO-BRANDZOV-002-1.jpg", "https://i.ibb.co/nzCzYR5/20180802-MONTENEGRO-BRANDZOV-002.jpg", "https://i.ibb.co/YBbR5hn/20180802-MONTENEGRO-KAASVROUWTJE-0008.jpg", "https://i.ibb.co/kx8RRmC/20180802-MONTENEGRO-KAASVROUWTJE-0063-1.jpg", "https://i.ibb.co/mbF00K1/20180802-MONTENEGRO-KAASVROUWTJE-0063.jpg", "https://i.ibb.co/sqdQmJK/20180802-MONTENEGRO-KAASVROUWTJE-0092-1.jpg", "https://i.ibb.co/9TbsB4B/20180802-MONTENEGRO-KAASVROUWTJE-0092.jpg", "https://i.ibb.co/RG8qt2L/20180802-MONTENEGRO-KAASVROUWTJE-0132.jpg", "https://i.ibb.co/B2XknCw/20180802-MONTENEGRO-ROZAJE-GRAVEYARD-0167-1.jpg", "https://i.ibb.co/9yF5TsM/20180802-MONTENEGRO-ROZAJE-GRAVEYARD-0167.jpg", "https://i.ibb.co/s1QYcY9/20180803-MONTENEGRO-BEELDHOUWER-0009.jpg", "https://i.ibb.co/09P1JzM/20180803-MONTENEGRO-BEELDHOUWER-0039-1.jpg", "https://i.ibb.co/P12G4hp/20180803-MONTENEGRO-BEELDHOUWER-0039.jpg", "https://i.ibb.co/vkkgNx1/20180803-MONTENEGRO-BEELDHOUWER-0075-1.jpg", "https://i.ibb.co/wSXdFKx/20180803-MONTENEGRO-BEELDHOUWER-0075.jpg", "https://i.ibb.co/D4SYqSf/20180803-MONTENEGRO-BEELDHOUWER-0082-1.jpg", "https://i.ibb.co/r2FzBNN/20180803-MONTENEGRO-BEELDHOUWER-0082.jpg", "https://i.ibb.co/qpwXW5b/20180803-MONTENEGRO-BEELDHOUWER-0098.jpg", "https://i.ibb.co/87fkbCk/20180803-MONTENEGRO-BEELDHOUWER-0141-1.jpg", "https://i.ibb.co/Zz5cZbn/20180803-MONTENEGRO-BEELDHOUWER-0141.jpg", "https://i.ibb.co/g4bRdTd/20180803-MONTENEGRO-KAASVROUWTJE-0263-1.jpg", "https://i.ibb.co/6szhfHP/20180803-MONTENEGRO-KAASVROUWTJE-0263.jpg", "https://i.ibb.co/GTP2PJs/20180803-MONTENEGRO-KAASVROUWTJE-0284.jpg", "https://i.ibb.co/QpHn2Bm/20180803-MONTENEGRO-ON-THE-ROAD-0157-Pano-1.jpg", "https://i.ibb.co/fxJPC7N/20180803-MONTENEGRO-ON-THE-ROAD-0157-Pano.jpg", "https://i.ibb.co/nMht4MP/20180803-MONTENEGRO-PODGORICA-0237-1.jpg", "https://i.ibb.co/jDrVG50/20180803-MONTENEGRO-PODGORICA-0237.jpg", "https://i.ibb.co/4jXwzsR/20180803-MONTENEGRO-ROZAJE-0004-1.jpg", "https://i.ibb.co/Xp7XS0h/20180803-MONTENEGRO-ROZAJE-0004.jpg", "https://i.ibb.co/RcF3ZPW/20180803-MONTENEGRO-ROZAJE-0010-1.jpg", "https://i.ibb.co/n1bF0s0/20180803-MONTENEGRO-ROZAJE-0010.jpg", "https://i.ibb.co/x3S4tzk/20180804-MONTENEGRO-RIJEKA-WINE-0426-1.jpg", "https://i.ibb.co/LSzGtyv/20180804-MONTENEGRO-RIJEKA-WINE-0426.jpg", "https://i.ibb.co/3TfYmF0/20180804-MONTENEGRO-RIJEKA-WINE-0446.jpg", "https://i.ibb.co/vYWb4rM/20180804-MONTENEGRO-RIJEKA-WINE-0479.jpg", "https://i.ibb.co/pdyzWBr/20180804-MONTENEGRO-ROMA-KAMP-ONE-0274-1.jpg", "https://i.ibb.co/6F3v721/20180804-MONTENEGRO-ROMA-KAMP-ONE-0274.jpg", "https://i.ibb.co/30jRrP3/20180804-MONTENEGRO-ROMA-KAMP-ONE-0279.jpg", "https://i.ibb.co/ZNk89b4/20180804-MONTENEGRO-ROMA-KAMP-ONE-0283.jpg", "https://i.ibb.co/0QxLsHZ/20180804-MONTENEGRO-ROMA-KAMP-ONE-0284-1.jpg", "https://i.ibb.co/hDNF7NX/20180804-MONTENEGRO-ROMA-KAMP-ONE-0284.jpg", "https://i.ibb.co/SmMkCyh/20180804-MONTENEGRO-ROMA-KAMP-ONE-0292-1.jpg", "https://i.ibb.co/HKzSXQy/20180804-MONTENEGRO-ROMA-KAMP-ONE-0292.jpg", "https://i.ibb.co/jLnYXF1/20180804-MONTENEGRO-ROMA-KAMP-ONE-0304-1.jpg", "https://i.ibb.co/CBkrm2K/20180804-MONTENEGRO-ROMA-KAMP-ONE-0304.jpg", "https://i.ibb.co/rm0VWtZ/20180804-MONTENEGRO-ROMA-KAMP-ONE-0309-1.jpg", "https://i.ibb.co/5hQ13XY/20180804-MONTENEGRO-ROMA-KAMP-ONE-0309.jpg", "https://i.ibb.co/cNYTW8W/20180804-MONTENEGRO-ROMA-KAMP-ONE-0310-1.jpg", "https://i.ibb.co/wNcb16d/20180804-MONTENEGRO-ROMA-KAMP-ONE-0310.jpg", "https://i.ibb.co/72kSDH2/20180804-MONTENEGRO-ROMA-KAMP-ONE-0332.jpg", "https://i.ibb.co/Z6MJC3H/20180804-MONTENEGRO-ROMA-KAMP-ONE-0337.jpg", "https://i.ibb.co/vDvVQDd/20180804-MONTENEGRO-ROMA-KAMP-ONE-0338-1.jpg", "https://i.ibb.co/FVTgn8Y/20180804-MONTENEGRO-ROMA-KAMP-ONE-0338.jpg", "https://i.ibb.co/ZWZgFQ2/20180804-MONTENEGRO-ROMA-KAMP-ONE-0339.jpg", "https://i.ibb.co/qmfGyP7/20180804-MONTENEGRO-ROMA-KAMP-ONE-0355-Pano.jpg", "https://i.ibb.co/tz4M1z5/20180804-MONTENEGRO-ROMA-KAMP-ONE-0368-1.jpg", "https://i.ibb.co/BCkNpc3/20180804-MONTENEGRO-ROMA-KAMP-ONE-0368.jpg", "https://i.ibb.co/yhpyLVM/20180804-MONTENEGRO-ROMA-KAMP-ONE-0376.jpg", "https://i.ibb.co/F0PVTKw/20180804-MONTENEGRO-ROMA-KAMP-ONE-0392.jpg", "https://i.ibb.co/8xtnr9C/20180804-MONTENEGRO-ROMA-KAMP-ONE-0405-1.jpg", "https://i.ibb.co/ynrhgc9/20180804-MONTENEGRO-ROMA-KAMP-ONE-0405.jpg", "https://i.ibb.co/ryrnh3P/20180804-MONTENEGRO-ROMA-KAMP-ONE-0409-1.jpg", "https://i.ibb.co/ryrnh3P/20180804-MONTENEGRO-ROMA-KAMP-ONE-0409-1.jpg", "https://i.ibb.co/TwNF6j2/20180804-MONTENEGRO-ROMA-KAMP-ONE-0414.jpg", "https://i.ibb.co/jyBB6SX/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-079-1.jpg", "https://i.ibb.co/jyBB6SX/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-079-1.jpg", "https://i.ibb.co/jyBB6SX/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-079-1.jpg", "https://i.ibb.co/gtHDjy9/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-100-Pano-2-1.jpg", "https://i.ibb.co/QD6XDKr/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-100-Pano-2.jpg", "https://i.ibb.co/kgR2M44/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-183.jpg", "https://i.ibb.co/TmwDmVc/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-190.jpg", "https://i.ibb.co/yRr0Ytm/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-216-1.jpg", "https://i.ibb.co/VSWGJvC/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-216.jpg", "https://i.ibb.co/WgWkW27/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-225.jpg", "https://i.ibb.co/X856Tq8/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-346.jpg", "https://i.ibb.co/RTMK2zV/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-409-1.jpg", "https://i.ibb.co/LJLcL9h/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-409.jpg", "https://i.ibb.co/DgJTvX3/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-516-1.jpg", "https://i.ibb.co/qpZ40vK/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-516.jpg", "https://i.ibb.co/BtCgKdN/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-542-1.jpg", "https://i.ibb.co/gvQjxZ3/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-542-2.jpg", "https://i.ibb.co/17PchXz/20180805-MONTENEGRO-PAVLOVA-STRANA-SKADAR-NAT-PARC-542.jpg", "https://i.ibb.co/fXm6zWZ/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-021.jpg", "https://i.ibb.co/jrkfhrh/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-029.jpg", "https://i.ibb.co/gJB7vPw/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-032.jpg", "https://i.ibb.co/6t4z5Gm/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-034.jpg", "https://i.ibb.co/3zdGwfZ/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-038.jpg", "https://i.ibb.co/1KtQf9H/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-046.jpg", "https://i.ibb.co/fSmZqdD/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-054.jpg", "https://i.ibb.co/C15pzVW/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-056.jpg", "https://i.ibb.co/TH02QZ8/20180807-BOSNIA-HERZEGOVINA-MOSTAR-WARZONE-060.jpg", "https://i.ibb.co/Tv2jJYB/20180807-BOSNIE-MOSTAR-TURKISCH-COFFEE-002-1.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e36", "thumbnail": "https://i.ibb.co/6wCqvwz/20180503-ROEMENIE-DONAU-DELTA-0705.jpg", "categoryName": "ROMANIA - DANUBE DELTA", "title": "A JOURNEY THROUGH THE DANUBE DELTA", "description": "A journey through the Danube Delta is a pearl necklace of accidental encounters with wonderful people. The lost and abandoned villages of Letea and Sfiștofca have made a moving impression on me.", "photos": ["https://i.ibb.co/JK1fy83/20180502-ROEMENIE-DONAU-DELTA-0026.jpg", "https://i.ibb.co/mB7Lkqh/20180502-ROEMENIE-DONAU-DELTA-0141.jpg", "https://i.ibb.co/S32Zy3C/20180503-ROEMENIE-DONAU-DELTA-0198.jpg", "https://i.ibb.co/2YsZWRT/20180503-ROEMENIE-DONAU-DELTA-0353.jpg", "https://i.ibb.co/gFjt9Fb/20180503-ROEMENIE-DONAU-DELTA-0369.jpg", "https://i.ibb.co/JntpYHx/20180503-ROEMENIE-DONAU-DELTA-0404.jpg", "https://i.ibb.co/DtFYHXN/20180503-ROEMENIE-DONAU-DELTA-0440.jpg", "https://i.ibb.co/KskKTqJ/20180503-ROEMENIE-DONAU-DELTA-0445.jpg", "https://i.ibb.co/cvzrFnp/20180503-ROEMENIE-DONAU-DELTA-0447.jpg", "https://i.ibb.co/9tQSstm/20180503-ROEMENIE-DONAU-DELTA-0504.jpg", "https://i.ibb.co/s2Ds5mF/20180503-ROEMENIE-DONAU-DELTA-0584.jpg", "https://i.ibb.co/7nytMv9/20180504-ROEMENIE-DONAU-DELTA-0835.jpg", "https://i.ibb.co/Wcgm3SL/20180504-ROEMENIE-DONAU-DELTA-0915.jpg", "https://i.ibb.co/jHRvCwT/20180504-ROEMENIE-DONAU-DELTA-0945.jpg", "https://i.ibb.co/phBfkBP/20180505-ROEMENIE-DONAU-DELTA-1725.jpg", "https://i.ibb.co/Vx6SkL4/20180505-ROEMENIE-DONAU-DELTA-1742.jpg", "https://i.ibb.co/727Cn75/20180505-ROEMENIE-DONAU-DELTA-1801.jpg", "https://i.ibb.co/fncjTs3/20180505-ROEMENIE-DONAU-DELTA-1811.jpg", "https://i.ibb.co/Y7H4K1S/20180505-ROEMENIE-DONAU-DELTA-1867.jpg", "https://i.ibb.co/xLrFw0G/20180505-ROEMENIE-DONAU-DELTA-1871.jpg", "https://i.ibb.co/Y7jXGXq/20180505-ROEMENIE-DONAU-DELTA-1876.jpg", "https://i.ibb.co/CzPqqfM/20180505-ROEMENIE-DONAU-DELTA-1906.jpg", "https://i.ibb.co/6RnDCwr/20180505-ROEMENIE-DONAU-DELTA-2057.jpg", "https://i.ibb.co/JFKSQVj/20180505-ROEMENIE-DONAU-DELTA-2149.jpg", "https://i.ibb.co/M2S7XkP/20180506-ROEMENIE-DONAU-DELTA-2343.jpg", "https://i.ibb.co/4KJ5H3Z/20180506-ROEMENIE-DONAU-DELTA-2517.jpg", "https://i.ibb.co/PGVw6pr/20180506-ROEMENIE-DONAU-DELTA-2530.jpg", "https://i.ibb.co/t8mZw5B/20180506-ROEMENIE-DONAU-DELTA-2533.jpg", "https://i.ibb.co/QvMQTSy/20180506-ROEMENIE-DONAU-DELTA-2543.jpg", "https://i.ibb.co/TK1sFPr/20180506-ROEMENIE-DONAU-DELTA-2657.jpg", "https://i.ibb.co/rb7vqwr/20180506-ROEMENIE-DONAU-DELTA-2681.jpg", "https://i.ibb.co/hm1y1Vs/20180506-ROEMENIE-DONAU-DELTA-2920.jpg", "https://i.ibb.co/ZSKK48F/20180506-ROEMENIE-DONAU-DELTA-2985.jpg", "https://i.ibb.co/dkc0BXy/20180506-ROEMENIE-DONAU-DELTA-2992.jpg", "https://i.ibb.co/2qtfzYF/20180506-ROEMENIE-DONAU-DELTA-3000.jpg", "https://i.ibb.co/s2HMG5G/20180506-ROEMENIE-DONAU-DELTA-3074.jpg", "https://i.ibb.co/gR4Mxkd/20180506-ROEMENIE-DONAU-DELTA-3348.jpg", "https://i.ibb.co/WWbcX5Q/20180506-ROEMENIE-DONAU-DELTA-3381.jpg", "https://i.ibb.co/syZwfpt/20180506-ROEMENIE-DONAU-DELTA-3407.jpg", "https://i.ibb.co/xMFk9wD/20180507-ROEMENIE-DONAU-DELTA-1105.jpg", "https://i.ibb.co/M9L78m2/20180507-ROEMENIE-DONAU-DELTA-1108.jpg", "https://i.ibb.co/MhQrq0y/20180507-ROEMENIE-DONAU-DELTA-1139.jpg", "https://i.ibb.co/KN0p6kc/20180507-ROEMENIE-DONAU-DELTA-1141.jpg", "https://i.ibb.co/fdG0Sj0/20180507-ROEMENIE-DONAU-DELTA-1149.jpg", "https://i.ibb.co/K6sBtpW/20180507-ROEMENIE-DONAU-DELTA-1150.jpg", "https://i.ibb.co/1nDq5sW/20180507-ROEMENIE-DONAU-DELTA-1333.jpg", "https://i.ibb.co/TmJkTtL/20180507-ROEMENIE-DONAU-DELTA-1387.jpg", "https://i.ibb.co/k8v5Vp8/20180507-ROEMENIE-DONAU-DELTA-1485.jpg", "https://i.ibb.co/r32JPk3/20180507-ROEMENIE-DONAU-DELTA-1489.jpg", "https://i.ibb.co/LQ6HCx9/20180507-ROEMENIE-DONAU-DELTA-1637.jpg", "https://i.ibb.co/k0GLgsv/20180507-ROEMENIE-DONAU-DELTA-1659.jpg", "https://i.ibb.co/ByQTXDH/20180508-ROEMENIE-DONAU-DELTA-1689.jpg", "https://i.ibb.co/v1z2kTr/20180508-ROEMENIE-DONAU-DELTA-1709.jpg", "https://i.ibb.co/54Qh2DV/20180802-MONTENEGRO-BRANDZOV-001.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e37", "thumbnail": "https://i.ibb.co/WWkW5d9/20180214-ROEMENIE-ROMA-CRAFT-MAN-160.jpg", "categoryName": "ROMA CRAFTMAN", "title": "The transformation from a fork to a bracelet", "description": "I have found The transformation from a fork to a bracelet With passion and patience", "photos": ["https://i.ibb.co/ZhYgLcX/20180214-ROEMENIE-ROMA-CRAFT-MAN-002.jpg", "https://i.ibb.co/nsnCqKv/20180214-ROEMENIE-ROMA-CRAFT-MAN-072.jpg", "https://i.ibb.co/QvBNCtT/20180214-ROEMENIE-ROMA-CRAFT-MAN-102.jpg", "https://i.ibb.co/tqkh8yq/20180214-ROEMENIE-ROMA-CRAFT-MAN-121.jpg", "https://i.ibb.co/WWkW5d9/20180214-ROEMENIE-ROMA-CRAFT-MAN-160.jpg", "https://i.ibb.co/8mMVcF3/20180214-ROEMENIE-ROMA-CRAFT-MAN-174.jpg", "https://i.ibb.co/vdjkn1Y/20180214-ROEMENIE-ROMA-CRAFT-MAN-177.jpg", "https://i.ibb.co/NZFQtbC/20180214-ROEMENIE-ROMA-CRAFT-MAN-193.jpg", "https://i.ibb.co/C9twNVw/20180214-ROEMENIE-ROMA-CRAFT-MAN-304.jpg", "https://i.ibb.co/Wss9Smc/20180214-ROEMENIE-ROMA-CRAFT-MAN-310.jpg", "https://i.ibb.co/rQ9LXsm/20180214-ROEMENIE-ROMA-CRAFT-MAN-314.jpg", "https://i.ibb.co/wSZ4Z8Y/20180214-ROEMENIE-ROMA-CRAFT-MAN-327.jpg", "https://i.ibb.co/yQ5hqz0/20180214-ROEMENIE-ROMA-CRAFT-MAN-398.jpg", "https://i.ibb.co/qNpF8Wm/20180214-ROEMENIE-ROMA-CRAFT-MAN-450.jpg", "https://i.ibb.co/6tpY3x5/20180214-ROEMENIE-ROMA-CRAFT-MAN-452.jpg", "https://i.ibb.co/DWp9FL9/20180214-ROEMENIE-ROMA-CRAFT-MAN-465.jpg", "https://i.ibb.co/JK1fy83/20180502-ROEMENIE-DONAU-DELTA-0026.jpg", "https://i.ibb.co/mB7Lkqh/20180502-ROEMENIE-DONAU-DELTA-0141.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e38", "thumbnail": "https://i.ibb.co/LtTBr2H/20201016-ITALY-MORANO-CALABRO-206p.jpg", "categoryName": "ITALY'S LOST VILLAGES", "title": "Surealistic journey through Italy during the pandemic. I hope this will soon be over.", "description": "pandemic i hope this will soon be over. Surealistic journey through Italy during the pandemic. I hope this will soon be over.", "photos": ["https://i.ibb.co/0KcxqyT/20201008-ITALY-CIVITA-DI-BAGNOREGIO-009b.jpg", "https://i.ibb.co/JyTQL4h/20201008-ITALY-CIVITA-DI-BAGNOREGIO-066-3.jpg", "https://i.ibb.co/VjkmBfd/20201008-ITALY-CIVITA-DI-BAGNOREGIO-096-Pano.jpg", "https://i.ibb.co/dQZ2chg/20201008-ITALY-CIVITA-DI-BAGNOREGIO-102-1.jpg", "https://i.ibb.co/nBFfphN/20201008-ITALY-CIVITA-DI-BAGNOREGIO-131.jpg", "https://i.ibb.co/ZG4Jj38/20201008-ITALY-CIVITA-DI-BAGNOREGIO-137.jpg", "https://i.ibb.co/ydR0vqG/20201008-ITALY-D750-CIVITA-DI-BAGNOREGIO-491.jpg", "https://i.ibb.co/B3B75w1/20201011-ITALY-D750-CRACO-316-1.jpg", "https://i.ibb.co/zRYnHDQ/20201011-ITALY-SALERNO-139.jpg", "https://i.ibb.co/XbyFvVp/20201012-ITALY-CRACO-022.jpg", "https://i.ibb.co/PFRqGdX/20201012-OITALY-750-CRACO-024.jpg", "https://i.ibb.co/XtfXyzt/20201012-OITALY-750-CRACO-038.jpg", "https://i.ibb.co/Njcz5Bw/20201015-ITALY-750-ALTOMONTE-118-Pano-lr.jpg", "https://i.ibb.co/1mzvV5F/20201015-ITALY-ALTOMONTE-004-lr.jpg", "https://i.ibb.co/LtTBr2H/20201016-ITALY-MORANO-CALABRO-206p.jpg", "https://i.ibb.co/LtTBr2H/20201016-ITALY-MORANO-CALABRO-206p.jpg", "https://i.ibb.co/T0CY6Np/20201017-ITALY-SALERNO-2721kopie.jpg", "https://i.ibb.co/C8pRWMz/20201017-ITALY-SALERNO-2730.jpg", "https://i.ibb.co/M9k1dqy/20201017-ITALY-SALERNO-2766b.jpg", "https://i.ibb.co/vDBZ0Kd/20201017-ITALY-SALERNO-BEACH-463.jpg", "https://i.ibb.co/9gkWJj9/20201019-ITALY-NAPELS-2331.jpg", "https://i.ibb.co/H7fx3yx/20201019-ITALY-NAPELS-2332bkopie.jpg", "https://i.ibb.co/S63gd1C/20201019-ITALY-NAPELS-2406.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e39", "thumbnail": "https://i.ibb.co/qspnWhC/20170911-VIEHSCHEID-BAD-HINDELANG-027.jpg", "categoryName": "BAD HINDELANG", "title": "YOU WANT TO GREET THE MORNING LIGHT", "description": "YOU WANT TO GREET THE MORNING LIGHT So get up early and be on time.", "photos": ["https://i.ibb.co/pZzBd8b/20170911-VIEHSCHEID-BAD-HINDELANG-034-1.jpg", "https://i.ibb.co/Pjzh9Ps/20170911-VIEHSCHEID-BAD-HINDELANG-046-1.jpg", "https://i.ibb.co/KKtNzw3/20170911-VIEHSCHEID-BAD-HINDELANG-056-1.jpg", "https://i.ibb.co/18sPCBQ/20170911-VIEHSCHEID-BAD-HINDELANG-105-1.jpg", "https://i.ibb.co/W5WQBSQ/20170911-VIEHSCHEID-BAD-HINDELANG-132.jpg", "https://i.ibb.co/Ykvm4h2/20170911-VIEHSCHEID-BAD-HINDELANG-151.jpg", "https://i.ibb.co/j3x2JZJ/20170911-VIEHSCHEID-BAD-HINDELANG-180.jpg", "https://i.ibb.co/RjMKmsL/20170911-VIEHSCHEID-BAD-HINDELANG-193.jpg", "https://i.ibb.co/xSvfLfS/20170911-VIEHSCHEID-BAD-HINDELANG-218-1.jpg", "https://i.ibb.co/L94jY8b/20170911-VIEHSCHEID-BAD-HINDELANG-218.jpg", "https://i.ibb.co/j5qZyBR/20170911-VIEHSCHEID-BAD-HINDELANG-242.jpg", "https://i.ibb.co/hCdnkdY/20170911-VIEHSCHEID-BAD-HINDELANG-248.jpg", "https://i.ibb.co/M608y3C/20170911-VIEHSCHEID-BAD-HINDELANG-266.jpg", "https://i.ibb.co/pfTrPWN/20170911-VIEHSCHEID-BAD-HINDELANG-270.jpg", "https://i.ibb.co/ZdwjwyM/20170911-VIEHSCHEID-BAD-HINDELANG-272-1.jpg", "https://i.ibb.co/vzXQzsK/20170911-VIEHSCHEID-BAD-HINDELANG-272.jpg", "https://i.ibb.co/k91JFNF/20170911-VIEHSCHEID-BAD-HINDELANG-279.jpg", "https://i.ibb.co/2vXC7MJ/20170911-VIEHSCHEID-BAD-HINDELANG-295-1.jpg", "https://i.ibb.co/2NGvWnj/20170911-VIEHSCHEID-BAD-HINDELANG-295.jpg", "https://i.ibb.co/rGbRYmP/20170911-VIEHSCHEID-BAD-HINDELANG-305.jpg", "https://i.ibb.co/bLRWPRt/20170911-VIEHSCHEID-BAD-HINDELANG-311-1.jpg", "https://i.ibb.co/k2rLwJ0/20170911-VIEHSCHEID-BAD-HINDELANG-311.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e3a", "thumbnail": "https://i.ibb.co/Zf7nz09/20161022-AIT-BEN-HABBOU-182.jpg", "categoryName": "FATIMA OF OUARZAZATE", "title": "THE PAINTER’S PALLET OF COLORFUL MOROCCO.", "description": "Enchanted by light and color you melt together with you camera.", "photos": ["https://i.ibb.co/yBbnn3H/20161021-AIT-BEN-HABBOU-351-Pano.jpg", "https://i.ibb.co/pJqQcWh/20161022-AIT-BEN-HABBOU-142.jpg", "https://i.ibb.co/vPt4rhc/20161022-AIT-BEN-HABBOU-155.jpg", "https://i.ibb.co/098TjnX/20161022-AIT-BEN-HABBOU-177-1.jpg", "https://i.ibb.co/Zf7nz09/20161022-AIT-BEN-HABBOU-182.jpg", "https://i.ibb.co/6nNSD4H/20161022-AIT-BEN-HABBOU-186.jpg", "https://i.ibb.co/xS2HhnR/20161022-AIT-BEN-HABBOU-199.jpg", "https://i.ibb.co/VJcTZ8w/20161022-AIT-BEN-HABBOU-212.jpg", "https://i.ibb.co/9v8VrhR/20161022-AIT-BEN-HADDOU-268.jpg", "https://i.ibb.co/hdc4hpV/20191118-MOROCCO-TOUR-0226.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e3b", "thumbnail": "https://i.ibb.co/pwyhkWx/20180210-MOROCCO-MARRAKESH-069.jpg", "categoryName": "THE PAINTER’S PALLET OF COLORFUL MOROCCO.", "title": "Enchanted by light and color you melt together with you camera.", "description": "THE PAINTER’S PALLET OF COLORFUL MOROCCO. Enchanted by light and color you melt together with you camera.", "photos": ["https://i.ibb.co/D8PYy6Y/20131104-MARRAKESH-1199.jpg", "https://i.ibb.co/w6y8mLD/20131104-MARRAKESH-1360.jpg", "https://i.ibb.co/M7jq7z1/20131104-MOROCCO-MARRAKESH-039.jpg", "https://i.ibb.co/XShqqhD/20131104-MOROCCO-MARRAKESH-044.jpg", "https://i.ibb.co/JvX6gMt/20161020-MARRAKESH-007-Disk-Station-Dec-16-1516-2019-Case-Conflict.jpg", "https://i.ibb.co/Xpxzd6x/20161025-MARRAKESH-067.jpg", "https://i.ibb.co/pwyhkWx/20180210-MOROCCO-MARRAKESH-069.jpg", "https://i.ibb.co/ZMnp8Fs/20180210-MOROCCO-MARRAKESH-070.jpg", "https://i.ibb.co/5R5m3Qx/20180210-MOROCCO-MARRAKESH-071.jpg", "https://i.ibb.co/NZsR5y4/20180210-MOROCCO-MARRAKESH-072.jpg", "https://i.ibb.co/TvXtnft/20180210-MOROCCO-MARRAKESH-074.jpg", "https://i.ibb.co/GTXm47c/20191117-MOROCCO-TOUR-0063.jpg", "https://i.ibb.co/5RpvSLv/20191117-MOROCCO-TOUR-0168.jpg", "https://i.ibb.co/ZT5LkDc/Djemaa-El-Fna-Marrakesh-TPC.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e3c", "thumbnail": "https://i.ibb.co/0Gm1zXB/20140119-MOROCCO-DESERT-124.jpg", "categoryName": "MOROCCO DESERT", "title": "— THE TRAVELCOLLECTION — MOROCCO DESERT THE PAINTER’S PALLET OF COLORFUL MOROCCO. Enchanted by light and color you melt together with you camera.", "description": "THE PAINTER’S PALLET OF COLORFUL MOROCCO. Enchanted by light and color you melt together with you camera.", "photos": ["https://i.ibb.co/kDwm4W6/20131101-MOROCCO-DESERT-133-1.jpg", "https://i.ibb.co/VLS3tfJ/20131101-MOROCCO-DESERT-133.jpg", "https://i.ibb.co/k8sBbyh/20131102-MOROCCO-DESERT-127-1.jpg", "https://i.ibb.co/RSQdKk4/20131102-MOROCCO-DESERT-132-1.jpg", "https://i.ibb.co/7jLHMfk/20131102-MOROCCO-DESERT-132.jpg", "https://i.ibb.co/0Gm1zXB/20140119-MOROCCO-DESERT-124.jpg", "https://i.ibb.co/YNKv4Gs/20140119-MOROCCO-DESERT-125.jpg", "https://i.ibb.co/fpY4KFh/20161022-MOROCCO-DESERT-121-1.jpg", "https://i.ibb.co/mHW0zPd/20191118-MOROCCO-DESERT-106.jpg", "https://i.ibb.co/801mBpt/20191118-MOROCCO-DESERT-110-1-1.jpg", "https://i.ibb.co/Jcznmx5/20191118-MOROCCO-DESERT-113-1-1.jpg", "https://i.ibb.co/Fhnz00R/20191118-MOROCCO-DESERT-113-1.jpg", "https://i.ibb.co/DzqSZRs/20191118-MOROCCO-DESERT-115-1.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e3d", "thumbnail": "https://i.ibb.co/0V3YD70/20161018-Chefchaouen-163-1.jpg", "categoryName": "MOROCCO CHEFCHAOUEN", "title": "THE PAINTER’S PALLET OF COLORFUL MOROCCO.", "description": " Enchanted by light and color you melt together with you camera.", "photos": ["https://i.ibb.co/YNKv4Gs/20140119-MOROCCO-DESERT-125.jpg", "https://i.ibb.co/9c4J0vj/20161017-Chefchaouen-066.jpg", "https://i.ibb.co/hWXzKFK/20161017-Chefchaouen-071.jpg", "https://i.ibb.co/0r6n6H6/20161018-Chefchaouen-006.jpg", "https://i.ibb.co/0yDLKks/20161018-Chefchaouen-015.jpg", "https://i.ibb.co/0V3YD70/20161018-Chefchaouen-163-1.jpg", "https://i.ibb.co/0V3YD70/20161018-Chefchaouen-163-1.jpg", "https://i.ibb.co/pPBgBjh/20161018-Chefchaouen-165-PCA.jpg", "https://i.ibb.co/30NK49c/20161018-Chefchaouen-166.jpg", "https://i.ibb.co/7JBKVQL/20161018-Chefchaouen-175.jpg", "https://i.ibb.co/L9kVC24/20161018-Chefchaouen-195-1.jpg", "https://i.ibb.co/qNvNVDg/20161018-MAROKKO-MARION-821.jpg", "https://i.ibb.co/RybzDT8/20161018-MAROKKO-MARION-830.jpg", "https://i.ibb.co/fpY4KFh/20161022-MOROCCO-DESERT-121-1.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e3e", "thumbnail": "https://i.ibb.co/B4v2BxC/20161015-20161015-20161015-Meknes-274-e1610367786951.jpg", "categoryName": "MEKNES - FEZ", "title": "THE PAINTER’S PALLET OF COLORFUL MOROCCO.", "description": "THE PAINTER’S PALLET OF COLORFUL MOROCCO. Enchanted by light and color you melt together with you camera.", "photos": ["https://i.ibb.co/kDwm4W6/20131101-MOROCCO-DESERT-133-1.jpg", "https://i.ibb.co/kDwm4W6/20131101-MOROCCO-DESERT-133-1.jpg", "https://i.ibb.co/k8sBbyh/20131102-MOROCCO-DESERT-127-1.jpg", "https://i.ibb.co/RSQdKk4/20131102-MOROCCO-DESERT-132-1.jpg", "https://i.ibb.co/RSQdKk4/20131102-MOROCCO-DESERT-132-1.jpg", "https://i.ibb.co/0Gm1zXB/20140119-MOROCCO-DESERT-124.jpg", "https://i.ibb.co/YNKv4Gs/20140119-MOROCCO-DESERT-125.jpg", "https://i.ibb.co/JK9jdVG/20161015-20161015-20161015-Meknes-274-1.jpg", "https://i.ibb.co/B4v2BxC/20161015-20161015-20161015-Meknes-274-e1610367786951.jpg", "https://i.ibb.co/zH60P2y/20161015-Meknes-013.jpg", "https://i.ibb.co/qjMfyRr/20161015-Meknes-027.jpg", "https://i.ibb.co/qNC1FRQ/20161015-Meknes-046.jpg", "https://i.ibb.co/kgYJC6G/20161015-Meknes-074.jpg", "https://i.ibb.co/MV2LwLj/20161015-Meknes-076.jpg", "https://i.ibb.co/nkWf0pP/20161015-Meknes-079.jpg", "https://i.ibb.co/vqS9QSN/20161015-Meknes-080.jpg", "https://i.ibb.co/pLc5nCY/20161015-Meknes-101.jpg", "https://i.ibb.co/wpYKzQG/20161015-Meknes-110.jpg", "https://i.ibb.co/wCr40Vg/20161015-Meknes-112.jpg", "https://i.ibb.co/LPyvqSY/20161015-Meknes-129.jpg", "https://i.ibb.co/NKrQsDd/20161015-Meknes-188.jpg", "https://i.ibb.co/17TX2L9/20161016-Fez-087.jpg", "https://i.ibb.co/sCZbWcC/20161016-Fez-106.jpg", "https://i.ibb.co/BnBPfCp/20161016-Fez-110.jpg", "https://i.ibb.co/pXD504k/20161016-Fez-118.jpg", "https://i.ibb.co/5Ggx1Wm/20161016-Fez-140.jpg", "https://i.ibb.co/fGX8Qm5/20161016-Fez-149.jpg", "https://i.ibb.co/cDDPHc2/20161016-Fez-223.jpg", "https://i.ibb.co/sH6htLB/20161016-Fez-249.jpg", "https://i.ibb.co/tZjydYX/20161016-Fez-297.jpg", "https://i.ibb.co/FWsHpxK/20161016-Fez-324.jpg", "https://i.ibb.co/m4YqJ3N/20161016-Fez-354.jpg", "https://i.ibb.co/4NW8C8v/20161016-Fez-377.jpg", "https://i.ibb.co/WnKb1JP/20161016-Fez-385.jpg", "https://i.ibb.co/tsgcxT2/20161016-Fez-399.jpg", "https://i.ibb.co/C9n6H9g/20161016-Fez-418.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e3f", "thumbnail": "https://i.ibb.co/b6NGBKX/20161012-Essaouira-002-scaled.jpg", "categoryName": "MOROCCO – ESSAOUIRA", "title": "THE PAINTER’S PALLET OF COLORFUL MOROCCO.", "description": "THE PAINTER’S PALLET OF COLORFUL MOROCCO. Enchanted by light and color you melt together with you camera.", "photos": ["https://i.ibb.co/XCXYSLy/20161012-Essaouira-002.jpg", "https://i.ibb.co/b6NGBKX/20161012-Essaouira-002-scaled.jpg", "https://i.ibb.co/xsDPjQy/20161012-Essaouira-153-scaled.jpg", "https://i.ibb.co/qM44Gvn/20161013-Essaouira-053-1-scaled.jpg", "https://i.ibb.co/DL7w8K8/20161013-Essaouira-102-Pano-scaled.jpg", "https://i.ibb.co/PtR73kt/20161013-Essaouira-111-Pano-scaled.jpg", "https://i.ibb.co/VDg596h/20161013-Essaouira-121-scaled.jpg", "https://i.ibb.co/dWnwVyz/20161013-Essaouira-145-scaled.jpg", "https://i.ibb.co/JvftGDC/20161013-Essaouira-153-scaled.jpg", "https://i.ibb.co/ZhfpJNN/20161013-Essaouira-173-Pano-scaled.jpg", "https://i.ibb.co/s6KV3H3/20161013-Essaouira-327.jpg", "https://i.ibb.co/x5ZXKTp/20191120-MOROCCO-TOUR-1059-scaled.jpg", "https://i.ibb.co/sJ86cTs/20191120-MOROCCO-TOUR-1092-scaled.jpg", "https://i.ibb.co/Z1Ly9my/20191120-MOROCCO-TOUR-1104-scaled.jpg", "https://i.ibb.co/qrHVRpZ/20191120-MOROCCO-TOUR-1128-scaled.jpg", "https://i.ibb.co/NjktSrW/20191120-MOROCCO-TOUR-1170-scaled.jpg", "https://i.ibb.co/9wzH8b3/20191120-MOROCCO-TOUR-1202-scaled.jpg", "https://i.ibb.co/vwXrmLB/20191120-MOROCCO-TOUR-1260-scaled.jpg", "https://i.ibb.co/dt1MnPN/20191121-MOROCCO-TOUR-1337-scaled.jpg", "https://i.ibb.co/qx5RsKD/20191121-MOROCCO-TOUR-1342-scaled.jpg", "https://i.ibb.co/sjxhCW6/20191121-MOROCCO-TOUR-1343-scaled.jpg", "https://i.ibb.co/1Q9qVk0/20191121-MOROCCO-TOUR-1445-scaled.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e40", "thumbnail": "https://i.ibb.co/K753MNz/20150121-BONAIRE-WASHINGTON-SLAGBAAI-013.jpg", "categoryName": "BONAIRE", "title": "BONAIREBON AI REBONAIR EBONA IRE", "description": "Lorem ipsum dolor sit amet, consectetu radipisi cing elitBeatae autem aperiam nequ quaera molestias voluptatibus harum ametipsa", "photos": ["https://i.ibb.co/jDx8Yfd/20150116-BONAIRE-WASHINGTON-SLAGBAAI-043.jpg", "https://i.ibb.co/44wjMTN/20150116-BONAIRE-WASHINGTON-SLAGBAAI-044.jpg", "https://i.ibb.co/bBpZ1z5/20150116-BONAIRE-WASHINGTON-SLAGBAAI-045.jpg", "https://i.ibb.co/q5200vy/20150116-BONAIRE-WASHINGTON-SLAGBAAI-046.jpg", "https://i.ibb.co/s27tQ6L/20150116-BONAIRE-WASHINGTON-SLAGBAAI-047.jpg", "https://i.ibb.co/TP0Stwc/20150117-BONAIRE-WASHINGTON-SLAGBAAI-010.jpg", "https://i.ibb.co/GHnCgsC/20150117-BONAIRE-WASHINGTON-SLAGBAAI-011.jpg", "https://i.ibb.co/nLnhKwG/20150117-BONAIRE-WASHINGTON-SLAGBAAI-018.jpg", "https://i.ibb.co/hYg0BpN/20150117-BONAIRE-WASHINGTON-SLAGBAAI-041.jpg", "https://i.ibb.co/ZVwYjMv/20150118-BONAIRE-WASHINGTON-SLAGBAAI-001.jpg", "https://i.ibb.co/PtMPqLF/20150118-BONAIRE-WASHINGTON-SLAGBAAI-009.jpg", "https://i.ibb.co/vzbw12F/20150118-BONAIRE-WASHINGTON-SLAGBAAI-012-1.jpg", "https://i.ibb.co/ykrZs74/20150118-BONAIRE-WASHINGTON-SLAGBAAI-012.jpg", "https://i.ibb.co/jL5xyDL/20150118-BONAIRE-WASHINGTON-SLAGBAAI-015.jpg", "https://i.ibb.co/Y8R5FGC/20150118-BONAIRE-WASHINGTON-SLAGBAAI-019.jpg", "https://i.ibb.co/VJ6FTDC/20150118-BONAIRE-WASHINGTON-SLAGBAAI-020.jpg", "https://i.ibb.co/1scrwxD/20150118-BONAIRE-WASHINGTON-SLAGBAAI-021.jpg", "https://i.ibb.co/Rp8vWsy/20150118-BONAIRE-WASHINGTON-SLAGBAAI-022.jpg", "https://i.ibb.co/G04LHzf/20150119-BONAIRE-WASHINGTON-SLAGBAAI-037.jpg", "https://i.ibb.co/yfNzLSK/20150119-BONAIRE-WASHINGTON-SLAGBAAI-038.jpg", "https://i.ibb.co/DgJndFN/20150119-BONAIRE-WASHINGTON-SLAGBAAI-039.jpg", "https://i.ibb.co/170CRt6/20150119-BONAIRE-WASHINGTON-SLAGBAAI-040.jpg", "https://i.ibb.co/0Mhj6gh/20150120-BONAIRE-WASHINGTON-SLAGBAAI-004.jpg", "https://i.ibb.co/5T7xv2m/20150120-BONAIRE-WASHINGTON-SLAGBAAI-030.jpg", "https://i.ibb.co/pJjFz7B/20150120-BONAIRE-WASHINGTON-SLAGBAAI-032.jpg", "https://i.ibb.co/rGXPmN8/20150120-BONAIRE-WASHINGTON-SLAGBAAI-033.jpg", "https://i.ibb.co/PFyp0DN/20150120-BONAIRE-WASHINGTON-SLAGBAAI-034.jpg", "https://i.ibb.co/dpjQ5MK/20150120-BONAIRE-WASHINGTON-SLAGBAAI-035.jpg", "https://i.ibb.co/cccCjhc/20150120-BONAIRE-WASHINGTON-SLAGBAAI-036.jpg", "https://i.ibb.co/3dfXPgT/20150121-BONAIRE-WASHINGTON-SLAGBAAI-002.jpg", "https://i.ibb.co/JBpTb9k/20150121-BONAIRE-WASHINGTON-SLAGBAAI-003.jpg", "https://i.ibb.co/p06GPKS/20150121-BONAIRE-WASHINGTON-SLAGBAAI-005.jpg", "https://i.ibb.co/Z2N7fcC/20150121-BONAIRE-WASHINGTON-SLAGBAAI-006.jpg", "https://i.ibb.co/WtBL0Pv/20150121-BONAIRE-WASHINGTON-SLAGBAAI-008.jpg", "https://i.ibb.co/K753MNz/20150121-BONAIRE-WASHINGTON-SLAGBAAI-013.jpg", "https://i.ibb.co/k43Gd6Y/20150121-BONAIRE-WASHINGTON-SLAGBAAI-014.jpg", "https://i.ibb.co/NFYdf3p/20150121-BONAIRE-WASHINGTON-SLAGBAAI-016.jpg", "https://i.ibb.co/Wk3q6mw/20150121-BONAIRE-WASHINGTON-SLAGBAAI-017.jpg", "https://i.ibb.co/TWxKTqF/20150121-BONAIRE-WASHINGTON-SLAGBAAI-023.jpg", "https://i.ibb.co/DrYv7WP/20150121-BONAIRE-WASHINGTON-SLAGBAAI-024.jpg", "https://i.ibb.co/D53RpwV/20150121-BONAIRE-WASHINGTON-SLAGBAAI-025.jpg", "https://i.ibb.co/nk2Kfdq/20150121-BONAIRE-WASHINGTON-SLAGBAAI-026.jpg", "https://i.ibb.co/yW5s7t9/20150121-BONAIRE-WASHINGTON-SLAGBAAI-027.jpg", "https://i.ibb.co/Np9LQ2s/20150121-BONAIRE-WASHINGTON-SLAGBAAI-028.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e41", "thumbnail": "https://i.ibb.co/jRR0d9k/20180812-CZECH-REPUBLIC-PRAGUE-012.jpg", "categoryName": "PRAGUE", "title": "A Quick stop in Prague I have to go back", "description": "Lorem ipsum dolor sit amet, consectetu radipisi cing elitBeatae autem aperiam nequ quaera molestias voluptatibus harum ametipsa", "photos": ["https://i.ibb.co/BG5fP7M/20180812-CZECH-REPUBLIC-PRAGUE-002.jpg", "https://i.ibb.co/jRR0d9k/20180812-CZECH-REPUBLIC-PRAGUE-012.jpg", "https://i.ibb.co/vjSJzB9/20180812-CZECH-REPUBLIC-PRAGUE-067.jpg", "https://i.ibb.co/TKdR758/20180812-CZECH-REPUBLIC-PRAGUE-113.jpg", "https://i.ibb.co/mhVssSx/20180812-CZECH-REPUBLIC-PRAGUE-116.jpg", "https://i.ibb.co/59DXZtn/20180812-CZECH-REPUBLIC-PRAGUE-119.jpg", "https://i.ibb.co/w4njtWS/20180812-CZECH-REPUBLIC-PRAGUE-124.jpg", "https://i.ibb.co/cLZ3q9p/20180812-CZECH-REPUBLIC-PRAGUE-139.jpg", "https://i.ibb.co/cT67CLw/20180812-CZECH-REPUBLIC-PRAGUE-166.jpg", "https://i.ibb.co/jM8LFGQ/20180812-CZECH-REPUBLIC-PRAGUE-169.jpg", "https://i.ibb.co/MDB1Mcs/20180812-CZECH-REPUBLIC-PRAGUE-197.jpg", "https://i.ibb.co/mq0ffqL/20180812-CZECH-REPUBLIC-PRAGUE-207.jpg", "https://i.ibb.co/CsnzCMw/20180812-CZECH-REPUBLIC-PRAGUE-237-Pano.jpg", "https://i.ibb.co/8XkxB40/DSC1184.jpg", "https://i.ibb.co/hfgg3h6/DSC1186.jpg", "https://i.ibb.co/YNBkLFd/DSC1188.jpg", "https://i.ibb.co/Vg9mq9v/DSC1515-Pano.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e42", "thumbnail": "https://i.ibb.co/JsGLf2X/20180210-ROEMENIE-BOEKAREST-091.jpg", "categoryName": "ROMANIA", "title": "From Bucharest to Viscri An educational journey", "description": "Lorem ipsum dolor sit amet, consectetu radipisi cing elitBeatae autem aperiam nequ quaera molestias voluptatibus harum ametipsa", "photos": ["https://i.ibb.co/h218NWx/20180210-ROEMENIE-BOEKAREST-009.jpg", "https://i.ibb.co/hm38R6k/20180210-ROEMENIE-BOEKAREST-015.jpg", "https://i.ibb.co/VghvkQV/20180210-ROEMENIE-BOEKAREST-024.jpg", "https://i.ibb.co/xXyHJ52/20180210-ROEMENIE-BOEKAREST-046.jpg", "https://i.ibb.co/Zfv8bjX/20180210-ROEMENIE-BOEKAREST-077.jpg", "https://i.ibb.co/SnsLXNF/20180210-ROEMENIE-BOEKAREST-080.jpg", "https://i.ibb.co/bRLdC6t/20180210-ROEMENIE-BOEKAREST-088.jpg", "https://i.ibb.co/JsGLf2X/20180210-ROEMENIE-BOEKAREST-091.jpg", "https://i.ibb.co/Qrk2ZrC/20180211-ROEMENIE-BOEKAREST-109-Pano-1.jpg", "https://i.ibb.co/ngHpz68/20180211-ROEMENIE-BOEKAREST-150.jpg", "https://i.ibb.co/GJ26Lk5/20180211-ROEMENIE-BOEKAREST-232.jpg", "https://i.ibb.co/sgPDZ5W/20180212-ROEMENIE-VISCRI-052.jpg", "https://i.ibb.co/Jvs8N0h/20180212-ROEMENIE-VISCRI-053.jpg", "https://i.ibb.co/Rv39xVh/20180212-ROEMENIE-VISCRI-054.jpg", "https://i.ibb.co/D45fhqS/20180212-ROEMENIE-VISCRI-055.jpg", "https://i.ibb.co/VWx8964/20180212-ROEMENIE-VISCRI-056.jpg", "https://i.ibb.co/WkRr4vF/20180212-ROEMENIE-VISCRI-057.jpg", "https://i.ibb.co/SJ29Fsq/20180212-ROEMENIE-VISCRI-058.jpg", "https://i.ibb.co/5htmX9f/20180212-ROEMENIE-VISCRI-059.jpg", "https://i.ibb.co/F6wwsT8/20180212-ROEMENIE-VISCRI-060.jpg", "https://i.ibb.co/gtbVBhJ/20180212-ROEMENIE-VISCRI-061.jpg", "https://i.ibb.co/0ntvZJj/20180212-ROEMENIE-VISCRI-062.jpg", "https://i.ibb.co/zJ0fmk1/20180212-ROEMENIE-VISCRI-063.jpg", "https://i.ibb.co/PN45Dwb/20180212-ROEMENIE-VISCRI-064.jpg", "https://i.ibb.co/cTH0cxJ/20180212-ROEMENIE-VISCRI-065.jpg", "https://i.ibb.co/7nDYXb4/20180212-ROEMENIE-VISCRI-066.jpg", "https://i.ibb.co/K01j9x1/20180213-ROMANIA-SIGHISOARA-023.jpg", "https://i.ibb.co/yQsJ6h8/DSC4947.jpg", "https://i.ibb.co/7GgNd1W/DSC5015-Pano.jpg", "https://i.ibb.co/rMv5hhs/DSC5074.jpg", "https://i.ibb.co/Xsn3mwr/DSC5092.jpg"], "__v": 0 }, { "_id": "62ab50899db371b54eb59e43", "thumbnail": "https://i.ibb.co/hm38R6k/20180210-ROEMENIE-BOEKAREST-015.jpg", "categoryName": "ROMANIA", "title": "ROMANIA ROMANIA ROMANIA ROMANIA", "description": "Lorem ipsum dolor sit amet, consectetu radipisi cing elitBeatae autem aperiam nequ quaera molestias voluptatibus harum ametipsa", "photos": ["https://i.ibb.co/h218NWx/20180210-ROEMENIE-BOEKAREST-009.jpg", "https://i.ibb.co/hm38R6k/20180210-ROEMENIE-BOEKAREST-015.jpg", "https://i.ibb.co/VghvkQV/20180210-ROEMENIE-BOEKAREST-024.jpg", "https://i.ibb.co/xXyHJ52/20180210-ROEMENIE-BOEKAREST-046.jpg", "https://i.ibb.co/Zfv8bjX/20180210-ROEMENIE-BOEKAREST-077.jpg", "https://i.ibb.co/SnsLXNF/20180210-ROEMENIE-BOEKAREST-080.jpg", "https://i.ibb.co/bRLdC6t/20180210-ROEMENIE-BOEKAREST-088.jpg", "https://i.ibb.co/JsGLf2X/20180210-ROEMENIE-BOEKAREST-091.jpg", "https://i.ibb.co/Qrk2ZrC/20180211-ROEMENIE-BOEKAREST-109-Pano-1.jpg", "https://i.ibb.co/ngHpz68/20180211-ROEMENIE-BOEKAREST-150.jpg", "https://i.ibb.co/GJ26Lk5/20180211-ROEMENIE-BOEKAREST-232.jpg", "https://i.ibb.co/sgPDZ5W/20180212-ROEMENIE-VISCRI-052.jpg", "https://i.ibb.co/Jvs8N0h/20180212-ROEMENIE-VISCRI-053.jpg", "https://i.ibb.co/Rv39xVh/20180212-ROEMENIE-VISCRI-054.jpg", "https://i.ibb.co/D45fhqS/20180212-ROEMENIE-VISCRI-055.jpg", "https://i.ibb.co/VWx8964/20180212-ROEMENIE-VISCRI-056.jpg", "https://i.ibb.co/WkRr4vF/20180212-ROEMENIE-VISCRI-057.jpg", "https://i.ibb.co/SJ29Fsq/20180212-ROEMENIE-VISCRI-058.jpg", "https://i.ibb.co/5htmX9f/20180212-ROEMENIE-VISCRI-059.jpg", "https://i.ibb.co/F6wwsT8/20180212-ROEMENIE-VISCRI-060.jpg", "https://i.ibb.co/gtbVBhJ/20180212-ROEMENIE-VISCRI-061.jpg", "https://i.ibb.co/0ntvZJj/20180212-ROEMENIE-VISCRI-062.jpg", "https://i.ibb.co/zJ0fmk1/20180212-ROEMENIE-VISCRI-063.jpg", "https://i.ibb.co/PN45Dwb/20180212-ROEMENIE-VISCRI-064.jpg", "https://i.ibb.co/cTH0cxJ/20180212-ROEMENIE-VISCRI-065.jpg", "https://i.ibb.co/7nDYXb4/20180212-ROEMENIE-VISCRI-066.jpg", "https://i.ibb.co/K01j9x1/20180213-ROMANIA-SIGHISOARA-023.jpg", "https://i.ibb.co/yQsJ6h8/DSC4947.jpg", "https://i.ibb.co/7GgNd1W/DSC5015-Pano.jpg", "https://i.ibb.co/rMv5hhs/DSC5074.jpg", "https://i.ibb.co/Xsn3mwr/DSC5092.jpg"], "__v": 0 }];











