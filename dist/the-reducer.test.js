"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var the_reducer_1 = require("./the-reducer");
var redux_1 = require("redux");
var arcDefinition = {
    module: "comic",
    entity: "arc",
    default: { id: "", name: "", url: "" }
};
var pageDefinition = {
    module: "comic",
    entity: "page",
    default: { id: "", name: "", description: "", arcId: "", sequence: 0 }
};
var mediaDefinition = {
    module: "media",
    entity: "file",
    default: { id: "", fileName: "" },
};
var pageMediaDefinition = {
    module: "media",
    entity: "pageMedia",
    default: { id: "", pageId: "", mediaId: "" }
};
var arc = __assign({}, the_reducer_1.entity(arcDefinition), { pages: the_reducer_1.getChildren(pageDefinition, "arcId") });
var page = __assign({}, the_reducer_1.entity(pageDefinition), { arc: the_reducer_1.getParent(arcDefinition, pageDefinition, "arcId"), files: the_reducer_1.getRelated(pageMediaDefinition, mediaDefinition, "pageId", "mediaId") });
var media = __assign({}, the_reducer_1.entity(mediaDefinition), { pages: the_reducer_1.getRelated(pageMediaDefinition, pageDefinition, "mediaId", "pageId") });
var pageMedia = the_reducer_1.entity(pageMediaDefinition);
var toggleDefinition = {
    module: "ui",
    entity: "toggle",
    default: { id: "", isVisible: false }
};
var t = the_reducer_1.entity(toggleDefinition);
var toggle = {
    reducer: t.reducer,
    show: function (id) { return t.update({ id: id, isVisible: true }); },
    hide: function (id) { return t.update({ id: id, isVisible: false }); },
    isOn: function (state, id) { return t.get(state, id).isVisible || false; }
};
var complexObjDef = {
    module: "test",
    entity: "complexObj",
    default: { id: "", name: "", subObject: { foo: "", bar: "", stuff: [] }, otherStuff: [] },
};
var complex = the_reducer_1.entity(complexObjDef);
// ----------------------------------------------
var reducer = redux_1.combineReducers({
    theReducer: the_reducer_1.theReducer(arc, page, toggle, media, pageMedia, complex)
});
var initialState = { theReducer: {} };
it('should insert objects into an empty store', function () {
    var state = [
        toggle.show("test")
    ].reduce(reducer, initialState);
    expect(toggle.isOn(state, "test")).toEqual(true);
});
it('should insert multiple objects into a store', function () {
    var state = [
        arc.addMultiple([
            { id: "1", name: "Test Arc" },
            { id: "2", name: "Test Arc 2" },
            { id: "3", name: "Test Arc 3" },
        ]),
    ].reduce(reducer, initialState);
    expect(arc.get(state, "1").name).toEqual("Test Arc");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(arc.get(state, "3").name).toEqual("Test Arc 3");
});
it('should update multiple objects into a store', function () {
    var state = [
        arc.addMultiple([
            { id: "1", name: "Test Arc" },
            { id: "2", name: "Test Arc 2" },
            { id: "3", name: "Test Arc 3" },
        ]),
        arc.updateMultiple([
            { id: "1", name: "Test Arc Updated" },
            { id: "3", name: "Test Arc 3 Updated" },
        ]),
    ].reduce(reducer, initialState);
    expect(arc.get(state, "1").name).toEqual("Test Arc Updated");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(arc.get(state, "3").name).toEqual("Test Arc 3 Updated");
});
it('should only update specified objects', function () {
    var state = [
        toggle.show("test"),
        toggle.show("test2"),
        toggle.hide("test"),
    ].reduce(reducer, initialState);
    expect(toggle.isOn(state, "test")).toEqual(false);
    expect(toggle.isOn(state, "test2")).toEqual(true);
});
it("should not update objects of other types with the same id", function () {
    var state = [
        arc.add({ id: "1", name: "Test Arc" }),
        page.add({ id: "1", name: "Test Page" }),
    ].reduce(reducer, initialState);
    expect(arc.get(state, "1").name).toEqual("Test Arc");
    expect(page.get(state, "1").name).toEqual("Test Page");
});
it("should provide default values for missing attributes if an non-existent entity is updated", function () {
    var state = [
        arc.update({ id: "1", name: "Test Arc" })
    ].reduce(reducer, initialState);
    expect(arc.get(state, "1").url).toEqual("");
});
it("should properly update nested entities", function () {
    var state = [
        complex.add({ id: "1", name: "test", subObject: { foo: "baz", bar: "biz", stuff: [1, 2, 3] }, otherStuff: ["4", "5", "6"] }),
        complex.add({ id: "2", name: "test", subObject: { foo: "baz", bar: "biz", stuff: [1, 2, 3] }, otherStuff: ["4", "5", "6"] }),
        complex.update({ id: "1", subObject: { foo: "baz2" } }),
    ].reduce(reducer, initialState);
    expect(complex.get(state, "2").subObject.bar).toEqual("biz");
    expect(complex.get(state, "1").subObject.bar).toEqual("biz");
});
it("should replace arrays when updating", function () {
    var state = [
        complex.add({ id: "1", name: "test", subObject: { foo: "baz", bar: "biz", stuff: [1, 2, 3] }, otherStuff: ["4", "5", "6"] }),
        complex.update({ id: "1", otherStuff: ["7", "8", "9"] }),
    ].reduce(reducer, initialState);
    expect(complex.get(state, "1").otherStuff).toEqual(["7", "8", "9"]);
});
it("should return default objects for empty stores", function () {
    expect(toggle.isOn(initialState, "1")).toEqual(false);
    expect(arc.get(initialState, "1").name).toEqual("");
    expect(page.get(initialState, "1").name).toEqual("");
});
it("should delete objects without deleting other objects", function () {
    var state = [
        arc.add({ id: "1", name: "Test Arc" }),
        arc.add({ id: "2", name: "Test Arc 2" }),
        page.add({ id: "1", name: "Test Page" }),
        arc.delete("1")
    ].reduce(reducer, initialState);
    expect(arc.getMultiple(state, function (a) { return a; }).length).toEqual(1);
    expect(arc.get(state, "1").name).toEqual("");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(page.get(state, "1").name).toEqual("Test Page");
});
it("should delete multiple objects", function () {
    var state = [
        arc.addMultiple([
            { id: "1", name: "Test Arc" },
            { id: "2", name: "Test Arc 2" },
            { id: "3", name: "Test Arc 3" },
            { id: "4", name: "Test Arc 4" },
            { id: "5", name: "Test Arc 5" },
        ]),
        arc.deleteMultiple(["1", "3", "5"])
    ].reduce(reducer, initialState);
    expect(arc.getMultiple(state, function (a) { return a; }).length).toEqual(2);
    expect(arc.get(state, "1").name).toEqual("");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(arc.get(state, "3").name).toEqual("");
    expect(arc.get(state, "4").name).toEqual("Test Arc 4");
    expect(arc.get(state, "5").name).toEqual("");
});
it("should be able to fetch multiple objects", function () {
    var state = [
        arc.add({ id: "1", name: "Test Arc" }),
        arc.add({ id: "2", name: "Test Arc 2" }),
    ].reduce(reducer, initialState);
    var arcs = arc.getMultiple(state, function (a) { return a; });
    expect(arcs.length).toEqual(2);
    expect(arcs[0].name).toEqual("Test Arc");
    expect(arcs[1].name).toEqual("Test Arc 2");
});
it("should be able to fetch and filter multiple objects", function () {
    var state = [
        arc.add({ id: "1", name: "Test Arc" }),
        arc.add({ id: "2", name: "Test Arc 2" }),
    ].reduce(reducer, initialState);
    var arcs = arc.getMultiple(state, function (a) { return a.id === "2"; });
    expect(arcs.length).toEqual(1);
    expect(arcs[0].name).toEqual("Test Arc 2");
});
it("can fetch children", function () {
    var state = [
        arc.add({ id: "1", name: "Test Arc" }),
        arc.add({ id: "2", name: "Test Arc 2" }),
        page.add({ id: "1", name: "Test Page", arcId: "1" }),
        page.add({ id: "2", name: "Test Page 2", arcId: "1" }),
        page.add({ id: "3", name: "Test Page 3", arcId: "2" }),
    ].reduce(reducer, initialState);
    var pages = arc.pages(state, "1");
    expect(pages.length).toEqual(2);
    expect(pages[0].name).toEqual("Test Page");
    expect(pages[1].name).toEqual("Test Page 2");
});
it("can fetch parents", function () {
    var state = [
        arc.add({ id: "1", name: "Test Arc" }),
        arc.add({ id: "2", name: "Test Arc 2" }),
        page.add({ id: "1", name: "Test Page", arcId: "1" }),
        page.add({ id: "2", name: "Test Page 2", arcId: "1" }),
        page.add({ id: "3", name: "Test Page 3", arcId: "2" }),
    ].reduce(reducer, initialState);
    expect(page.arc(state, "1").name).toEqual("Test Arc");
    expect(page.arc(state, "3").name).toEqual("Test Arc 2");
});
it("can fetch related entities", function () {
    var state = [
        page.add({ id: "1", name: "Test Page" }),
        page.add({ id: "2", name: "Test Page 2" }),
        media.add({ id: "1", fileName: "testFile.png" }),
        media.add({ id: "2", fileName: "testFile2.png" }),
        media.add({ id: "3", fileName: "testFile3.png" }),
        media.add({ id: "4", fileName: "testFile4.png" }),
        pageMedia.add({ id: "1", mediaId: "1", pageId: "1" }),
        pageMedia.add({ id: "2", mediaId: "2", pageId: "1" }),
        pageMedia.add({ id: "3", mediaId: "3", pageId: "1" }),
        pageMedia.add({ id: "4", mediaId: "4", pageId: "1" }),
        pageMedia.add({ id: "5", mediaId: "1", pageId: "2" }),
        pageMedia.add({ id: "6", mediaId: "2", pageId: "2" }),
    ].reduce(reducer, initialState);
    var page1Media = page.files(state, "1");
    var page2Media = page.files(state, "2");
    var media1Pages = media.pages(state, "1");
    var media2Pages = media.pages(state, "2");
    var media3Pages = media.pages(state, "3");
    var media4Pages = media.pages(state, "4");
    expect(page1Media.length).toEqual(4);
    expect(page1Media[0].fileName).toEqual("testFile.png");
    expect(page2Media.length).toEqual(2);
    expect(page1Media[1].fileName).toEqual("testFile2.png");
    expect(media1Pages.length).toEqual(2);
    expect(media1Pages[1].name).toEqual("Test Page 2");
    expect(media2Pages.length).toEqual(2);
    expect(media1Pages[1].name).toEqual("Test Page 2");
    expect(media3Pages.length).toEqual(1);
    expect(media1Pages[0].name).toEqual("Test Page");
    expect(media4Pages.length).toEqual(1);
    expect(media1Pages[0].name).toEqual("Test Page");
});
