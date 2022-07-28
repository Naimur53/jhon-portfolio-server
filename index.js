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
const menu = require('./models/menu');
const { initializeApp } = require('firebase-admin/app');
const admin = require("firebase-admin");

const { updateMany } = require('./models/blog');
const nodemailer = require("nodemailer");

// firebase admin init

const serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key,
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// cloudinary config 
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
});
//middle
var corsOptions = {
    origin: ['http://localhost:5000', 'http://john-pink.vercel.app/'],
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.icikx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

mongoose.connect(uri, () => {
    console.log('connect', uri)
}, e => console.log(e))

async function verifyToken(req, res, next) {
    console.log(req.headers.authorization, 'hears');
    if (req.headers.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken)
            req.decodedUserEmail = decodedUser.email
        }
        catch {

        }
    }
    next();
}
console.log(

)

async function run() {
    try {
        app.get('/category', async (req, res) => {
            const { short, normal } = req.query;
            console.log(short);
            let result;
            if (short) {

                result = await categories.find({}).select('_id thumbnail categoryName title description subCategory').limit(20)

            }
            else if (normal) {
                result = await categories.find({}).select('_id thumbnail categoryName title description subCategory')

            }
            else {
                result = await categories.find({})
            }
            res.json(result);
        })
        app.post('/category', verifyToken, async (req, res) => {
            const data = req.body
            try {
                if (data?.user === req?.decodedUserEmail) {
                    const result = await categories.create(req.body?.mainData);
                    // console.log('reslut');
                    res.json(result);
                } else {
                    res.status(400).json({ error: 'UnAuthorize' })
                }
            } catch (e) {
                console.log(e);
                res.status(400).json({ error: 'bad req' })
            }


        })
        app.put('/category', verifyToken, async (req, res) => {
            const data = req.body;
            const id = req.query?.id
            console.log({ id, email: req?.decodedUserEmail, });
            try {
                if (data?.user === req?.decodedUserEmail) {
                    const result = await categories.findByIdAndUpdate(id, data.mainData);

                    console.log('result');
                    res.json(result);
                } else {
                    res.status(400).json({ error: 'UnAuthorize' })
                }

            } catch (e) {
                res.status(400).json({ error: 'bad req' })

            }
            // const result = await categories.create(req.body)


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
        app.delete('/category', verifyToken, async (req, res) => {
            try {
                const id = req.query.id;
                if (req.body?.user === req?.decodedUserEmail) {
                    console.log('toi valo re');

                    const result = await categories.findById(id);
                    res.json({});
                }
                else {
                    res.status(400).json({ error: 'UnAuthorize' })
                }

            }
            catch (e) {
                res.status(400).json({ error: 'bad req' })
            }
        })
        app.get('/photostream', async (req, res) => {
            try {
                const result = await categories.findOne({}).select('photos');
                console.log(result);
                res.json(result);
            }
            catch (e) {
                console.log(e);
                res.status(400).json({ error: 'bad req', })
            }
        })
        app.get('/chooseMenu', async (req, res) => {
            try {
                const result = await menu.find({});
                console.log(result);
                res.json(result);
            }
            catch (e) {
                res.status(400).json({ error: 'bad req', })
            }
        })
        app.post('/chooseMenu', async (req, res) => {
            try {
                const data = req.body
                const deleting = await menu.deleteMany({});
                const result = await menu.create(data);
                res.json(result);
            }
            catch (e) {
                res.status(400).json({ error: 'bad req', })
            }
        })
        app.get('/uniqCategory', async (req, res) => {
            try {

                const result = await categories.distinct("categoryName")
                console.log(result, 'res');
                res.json(result);
            }
            catch (e) {
                res.status(400).json({ error: 'bad req', })
            }
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
                    result = await blog.find({}).sort({ _id: 1 }).select('heading description img address date').limit(10);
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
        app.post('/blog', verifyToken, async (req, res) => {
            const data = req.body;
            try {
                if (data?.user === req?.decodedUserEmail) {
                    const createBlog = new blog(data.mainData);
                    const result = await createBlog.save();
                    res.json(result);
                } else {
                    res.status(400).json({ error: 'UnAuthorize' })
                }
            } catch (e) {
                res.status(400).json({ error: 'bad req' })
            }

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
                    res.json({ success: 'successfully saved' });
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
            const { email } = req.query;
            console.log(email, 'iddd');
            try {
                if (email) {
                    const result = await user.findOne({ email });
                    console.log(result);
                    res.json(result);
                }
                else {
                    const allUser = await user.find({});
                    res.json(allUser)
                }
            } catch (e) {
                console.log(e);
                res.status(400).json({ error: 'something bd' })
            }

        })


        app.put('/user', async (req, res) => {
            try {
                const data = req.body;
                console.log(data);
                const filter = { email: data.email };
                const options = { upsert: true }
                const updateDoc = { $set: data }
                const result = await user.updateOne(filter, updateDoc, options);
                console.log(result);
                res.json(result);
            }
            catch {
                res.status(404).json({ error: 'data cant be save' });
            }

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
                        pass: process.env.USER_PASS
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
        //dashboard
        app.get('/totalUser', async (req, res) => {
            const allUser = await user.count();
            res.json({ user: allUser })

        })
        app.get('/totalCategories', async (req, res) => {
            const allCategories = await categories.count();
            res.json({ categories: allCategories })

        })
        app.get('/last7blog', async (req, res) => {
            // const last7blog = await blog.find().sort({ _id: -1 }).limit(7).select('comments love')
            const result = await blog.aggregate([
                {
                    "$project":
                        { comment: { $size: "$comments" }, love: { $size: "$love" }, date: 1 }
                },
                { $sort: { _id: -1 } },
                { $limit: 7 }
            ])
            res.json(result)

        })
        app.get('/blogTotalLC', async (req, res) => {
            try {
                const result = await blog.aggregate([
                    {
                        "$project":
                            { comment: { $size: "$comments" }, love: { $size: "$love" } }
                    }
                ])
                res.json(result);
            }
            catch (e) {
                console.log(e);
                res.status(400).json({ error: e.message })
            }
        })
        app.get('/blogCount', async (req, res) => {
            try {
                const result = await blog.count()
                res.json({ blog: result });
            }
            catch (e) {
                console.log(e);
                res.status(400).json({ error: e.message })
            }
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





// const result = await categories.find({}).select('_id thumbnail categoryName subCategory')
// let uniqCategory = result.filter(single => !single.subCategory);
// let mainData = []
// uniqCategory.forEach((ele, i) => {
//     // const dropdown=[];
//     const sameCategory = result.filter(single => single.categoryName === ele.categoryName && single.subCategory)
//     mainData = [...mainData, { ...ele._doc, dropdown: sameCategory }]
// })

// console.log(mainData);







