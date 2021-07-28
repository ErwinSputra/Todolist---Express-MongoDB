require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
  console.log("MongoDB Connected…")
}).catch(err => console.log(err));

const itemSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({ 
  name: "Welcome to my Todolist" 
});

const item2 = new Item({ 
  name: "Click + sign to add your item" 
});

const item3 = new Item({ 
  name: "<-- Click here to delete item" 
});

const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  Item.find({}, function (err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItem, function (err, docs) {
          console.log("Successfully insert the data!");
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: results});  
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.listName.trim();

  const item = new Item({ 
    name: itemName 
  });

  if (listName === "Today") {

    item.save();
    res.redirect("/");

  } else {

    List.findOne({name: listName}, function (err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName); 
      }
    });
  }
  
  
});

app.post("/delete", function (req, res) {
  
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Success to delete item");  
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {
      if(!err){
        console.log("Succes delete element of doc in array");
        res.redirect("/" + listName);
      }
    });
  }
  
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function (err, foundList) {

    if (!err) {
      // console.log(foundList);
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItem
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        //Display the list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
