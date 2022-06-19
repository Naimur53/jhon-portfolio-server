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
                    const res = await thatBlog.comments.push(req.body)
                    const rs = await thatBlog.save()
                    res.json(rs);
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
            const data = req.body;
            console.log(data);
            res.json({ res: 'done' });

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
    res.send('const group server is runing  ');
})
app.listen(port, () => {
    console.log('server is running at port', port);
})