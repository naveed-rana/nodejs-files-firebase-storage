const express = require("express");
const path = require("path");
var fs = require("fs");
var PdfPrinter = require("pdfmake");
var bodyParser = require("body-parser");
const cookieparser = require("cookie-parser");
var session = require("express-session");

const { Storage } = require("@google-cloud/storage");
// Your Google Cloud Platform project ID
const projectId = "promising-saga-232017";
// Creates a client
const storage = new Storage({
  projectId: projectId,
  keyFilename: "./key.json"
});
// The name for the new bucket
var bucket = storage.bucket("promising-saga-232017.appspot.com");

const PORT = process.env.PORT || 2020;

var app = express();
var fonts = {
  Roboto: {
    normal: "fonts/Roboto-Regular.ttf",
    bold: "fonts/Roboto-Medium.ttf",
    italics: "fonts/Roboto-Italic.ttf",
    bolditalics: "fonts/Roboto-MediumItalic.ttf"
  }
};

var printer = new PdfPrinter(fonts);

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "@#^&$!#_)(@!#)**(@^%*&^*#${}|{@#$@#$(#@",
    resave: true,
    saveUninitialized: true
  })
);
app.use(cookieparser());

app.get("/", function(req, res) {
  console.log("Got a GET request for the homepage");
  res.send("Server up and running");
});

app.post("/generatePayStubs", function(req, res) {
  console.log("req", req.body);

  var dd = {
    content: [
      { text: "UnoHr", style: "subheader" },
      "United State, Us",
      "+92323263541",
      "Fax 2353",
      { text: "Earning Statement", style: "statement" },
      {
        style: "tableExample",
        table: {
          widths: ["*", "*", "*", "*"],
          body: [
            [
              {
                text: "Employee Name",
                margin: [0, 5, 0, 5],
                alignment: "center"
              },
              {
                text: "Employee id",
                margin: [0, 5, 0, 5],
                alignment: "center"
              },
              { text: "Pay Period", margin: [0, 5, 0, 5], alignment: "center" },
              { text: "Pay Date", margin: [0, 5, 0, 5], alignment: "center" }
            ],
            [
              {
                text: req.body.name,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              },
              {
                text: req.body.id,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              },
              {
                text: req.body.payperiod,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              },
              {
                text: req.body.date,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              }
            ],
            [
              { text: "Rate", margin: [0, 5, 0, 5], alignment: "center" },
              { text: "Hour", margin: [0, 5, 0, 5], alignment: "center" },
              { text: "Deduction", margin: [0, 5, 0, 5], alignment: "center" },
              { text: "Net Pay", margin: [0, 5, 0, 5], alignment: "center" }
            ],
            [
              {
                text: req.body.rate,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              },
              {
                text: req.body.hour,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              },
              {
                text: req.body.deduction,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              },
              {
                text: req.body.pay,
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0]
              }
            ]
          ]
        },
        layout: {
          fillColor: function(rowIndex, node, columnIndex) {
            return rowIndex % 2 === 0 ? "#CCCCCC" : null;
          }
        }
      },
      {
        text:
          "This template represents a colored (blue) paystub that can be printed on any standard check paper. It shows all the payment details but does not show the employees full address This template represents a colored (blue) paystub that can be printed on any standard check paper. It shows all the payment details but does not show the employees full address.",
        fontSize: 8,
        italics: true
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      statement: {
        alignment: "right",
        bold: true
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: "black"
      }
    },
    defaultStyle: {
      // alignment: 'justify'
    }
  };

  var now = new Date();

  var pdfDoc = printer.createPdfKitDocument(dd);
  pdfDoc.pipe(fs.createWriteStream(`./public/${req.body.filename}.pdf`));
  pdfDoc.end();

  console.log(new Date() - now);
  let filename1 = `./public/${req.body.filename}.pdf`;
  let filename2 = `${req.body.filename}.pdf`;

  bucket
    .upload(filename1)
    .then(send => {
      console.log("save into firebase");
      const file = bucket.file(filename2);
      file
        .getSignedUrl({
          action: "read",
          expires: "03-09-2491"
        })
        .then(signedUrls => {
          res.status(200).json(signedUrls[0]);
          // console.log(signedUrls[0]);
        })
        .catch(err => {
          console.log("err", err);
          res.status(500).send("err");
        });
    })
    .catch(err => {
      console.log("err", err);
      res.status(500).send("err");
    });
  // res.send("done");
});

app.use(express.static(path.join(__dirname, "./public")));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
