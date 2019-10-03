import { entity, getChildren, getParent, getRelated, singleton, theReducer } from './index';
import { ChildSelector, Entity, IEntityAction, IEntityContainer, IEntityReducer, ParentSelector, RelatedSelector } from './index';
import { combineReducers } from 'redux';
import { IEntityCustomAction, IEntityState } from './entity';

// ----------------------------------------------
interface IComicArc {
    id:string;
    name:string;
    url:string;
}

const arcDefinition = {
    module: "comic",
    entity: "arc",
    default: {id: "", name: "", url: ""}
}
// ----------------------------------------------
interface IComicPage {
    id:string;
    name:string;
    description:string;
    arcId:string;
    sequence:number;
}

const pageDefinition = {
    module: "comic",
    entity: "page",
    default: {id: "", name: "", description: "", arcId: "", sequence: 0}
}
// ----------------------------------------------
interface IMedia {
    id:string;
    fileName:string;
}

const mediaDefinition = {
    module: "media",
    entity: "file",
    default: {id: "", fileName: ""},
}
// ----------------------------------------------
interface IPageMedia {
    id:string;
    pageId:string;
    mediaId:string;
}
const pageMediaDefinition = {
    module: "media",
    entity: "pageMedia",
    default: {id: "", pageId: "", mediaId: ""}
}
// ----------------------------------------------

interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
const arc:IArcRedux = {
    ...entity<IComicArc>(arcDefinition),
    pages: getChildren<IComicPage>(pageDefinition, "arcId"),
};

interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
    files: RelatedSelector<IPageMedia, IMedia>;
}
const page:IPageRedux = {
    ...entity<IComicPage>(pageDefinition),
    arc: getParent<IComicArc, IComicPage>(arcDefinition, pageDefinition, "arcId"),
    files: getRelated<IPageMedia, IMedia>(pageMediaDefinition, mediaDefinition, "pageId", "mediaId")
};

interface IMediaRedux extends Entity<IMedia> {
    pages: RelatedSelector<IPageMedia, IComicPage>;
}
const media:IMediaRedux = {
    ...entity<IMedia>(mediaDefinition),
    pages: getRelated<IPageMedia, IComicPage>(pageMediaDefinition, pageDefinition, "mediaId", "pageId")
}

interface IPageMediaRedux extends Entity<IPageMedia> {}
const pageMedia:IPageMediaRedux = entity<IPageMedia>(pageMediaDefinition);
// ----------------------------------------------

interface IToggle {
    id:string;
    isVisible:boolean;
}

const toggleDefinition = {
    module: "ui",
    entity: "toggle",
    default: {id: "", isVisible: false}
}

interface IToggleRedux {
    reducer: IEntityReducer<IToggle>,
    show: (id:string) => IEntityAction<IToggle>;
    hide: (id:string) => IEntityAction<IToggle>;
    isOn: (state:IEntityContainer<IToggle>, id:string) => boolean;
}

const t = entity<IToggle>(toggleDefinition);
const toggle:IToggleRedux = {
    reducer: t.reducer,
    show: (id:string) => t.update({id, isVisible: true}),
    hide: (id:string) => t.update({id, isVisible: false}),
    isOn: (state:IEntityContainer<IToggle>, id:string) => t.get(state, id).isVisible || false
};
// ----------------------------------------------
interface IComplexObject {
    id:string;
    name:string;
    subObject: {
        foo:string;
        bar:string;
        stuff:number[];
    };
    otherStuff:string[];
}

interface IComplexObjectCustomAction {
    id:string;
    value: string;
}

const complexObjDef = {
    module: "test",
    entity: "complexObj",
    default: {id:"", name: "", subObject: {foo: "", bar: "", stuff: []}, otherStuff: []},
    customReducer: {
        concatOtherStuff: (state:IEntityState<IComplexObject>, data:IComplexObjectCustomAction) =>({
            ...state,
            [data.id]: {
                ...state[data.id],
                otherStuff: [...state[data.id].otherStuff, data.value]
            }
        }),
    }
};

const complex = entity<IComplexObject, IComplexObjectCustomAction>(complexObjDef);

// ----------------------------------------------

interface ISingleton {
    name:string;
    stuff:string[];
};

const singletonObjDef = {
    module: "test",
    entity: "singleton",
    default: {name: "", stuff: []},
}

const singletonObj2Def = {
    module: "test2",
    entity: "singleton2",
    default: {name: "", stuff: []},
    customReducer: {
        concatStuff: (state:ISingleton, data:{value:string}):ISingleton => ({
            ...state,
            stuff: [...state.stuff, data.value]
        })
    }
}

const single = singleton<ISingleton, {}>(singletonObjDef);
const single2 = singleton<ISingleton, {value:string}>(singletonObj2Def);

// ----------------------------------------------

const reducer = combineReducers({
    theReducerEntities: theReducer.entity(arc, page, toggle, media, pageMedia, complex),
    theReducerSingletons: theReducer.singleton(single, single2),
});
const initialState = {
    theReducerEntities: {},
    theReducerSingletons: {},
};

it('should insert entities into an empty store', () => {
    const state = [
        toggle.show("test")
    ].reduce(reducer, initialState);

    expect(toggle.isOn(state, "test")).toEqual(true);
});

it('should update existing entities when re-adding them', () => {
    const state = [
        arc.add({id: "1", name: "Test", url: "/test-url"}),
        arc.add({id: "1", name: "NewTest"}),
    ].reduce(reducer, initialState);

    expect(arc.get(state, "1").name).toEqual("NewTest");
    expect(arc.get(state, "1").url).toEqual("/test-url");
});

it('should insert multiple entities into a store', () => {
    const state = [
        arc.addMultiple([
            {id: "1", name: "Test Arc"},
            {id: "2", name: "Test Arc 2"},
            {id: "3", name: "Test Arc 3"},
        ]),
    ].reduce(reducer, initialState);

    expect(arc.get(state, "1").name).toEqual("Test Arc");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(arc.get(state, "3").name).toEqual("Test Arc 3");
});

it('should update multiple entities into a store', () => {
    const state = [
        arc.addMultiple([
            {id: "1", name: "Test Arc"},
            {id: "2", name: "Test Arc 2"},
            {id: "3", name: "Test Arc 3"},
        ]),
        arc.updateMultiple([
            {id: "1", name: "Test Arc Updated"},
            {id: "3", name: "Test Arc 3 Updated"},
        ]),
    ].reduce(reducer, initialState);

    expect(arc.get(state, "1").name).toEqual("Test Arc Updated");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(arc.get(state, "3").name).toEqual("Test Arc 3 Updated");
});

it('should only update specified entities', () => {
    const state = [
        toggle.show("test"),
        toggle.show("test2"),
        toggle.hide("test"),
    ].reduce(reducer, initialState);

    expect(toggle.isOn(state, "test")).toEqual(false);
    expect(toggle.isOn(state, "test2")).toEqual(true);
});

it("should not update entities of other types with the same id", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        page.add({id: "1", name: "Test Page"}),
    ].reduce(reducer, initialState);

    expect(arc.get(state, "1").name).toEqual("Test Arc");
    expect(page.get(state, "1").name).toEqual("Test Page");
});

it("should provide default values for missing attributes if an non-existent entity is updated", () => {
    const state = [
        arc.update({id: "1", name: "Test Arc"})
    ].reduce(reducer, initialState);

    expect(arc.get(state, "1").url).toEqual("");
});

it("should properly update nested entities", () => {
    const state = [
        complex.add({id: "1", name: "test", subObject: {foo: "baz", bar: "biz", stuff: [1, 2, 3]}, otherStuff: ["4", "5", "6"]}),
        complex.add({id: "2", name: "test", subObject: {foo: "baz", bar: "biz", stuff: [1, 2, 3]}, otherStuff: ["4", "5", "6"]}),
        complex.update({id: "1", subObject: {foo: "baz2"}}),
    ].reduce(reducer, initialState);

    expect(complex.get(state, "2").subObject.bar).toEqual("biz");
    expect(complex.get(state, "1").subObject.bar).toEqual("biz");
});

it("should replace arrays when updating", () => {
    const state = [
        complex.add({id: "1", name: "test", subObject: {foo: "baz", bar: "biz", stuff: [1, 2, 3]}, otherStuff: ["4", "5", "6"]}),
        complex.update({id: "1", otherStuff: ["7", "8", "9"]}),
    ].reduce(reducer, initialState);

    expect(complex.get(state, "1").otherStuff).toEqual(["7", "8", "9"]);
});

it("should support custom reducers for entities", () => {
    const state = [
        complex.add({id: "1", name: "test", subObject: {foo: "baz", bar: "biz", stuff: [1, 2, 3]}, otherStuff: ["4", "5", "6"]}),
        complex.custom("concatOtherStuff", {id: "1", value: "7"}),
    ].reduce(reducer, initialState);

    expect(complex.get(state, "1").otherStuff).toEqual(["4", "5", "6", "7"]);
});

// TODO: Tests for singleton custom reducers

it("should support singleton (id-less) entities", () => {
    const state = [
        single.update({name: "test"}),
        single.update({stuff: ["1", "2", "3"]})
    ].reduce(reducer, initialState);

    expect(single.get(state).name).toEqual("test");
    expect(single.get(state).stuff).toEqual(["1", "2", "3"]);
});

it("should not update unrelated singletons", () => {
    const state = [
        single.update({name: "test"}),
        single2.update({name: "test2"}),
    ].reduce(reducer, initialState);

    expect(single.get(state).name).toEqual("test");
    expect(single2.get(state).name).toEqual("test2");
});

it("should return default objects for empty stores", () => {
    expect(toggle.isOn(initialState, "1")).toEqual(false);
    expect(arc.get(initialState, "1").name).toEqual("");
    expect(page.get(initialState, "1").name).toEqual("");
});

it("should delete objects without deleting other objects", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),

        page.add({id: "1", name: "Test Page"}),

        arc.delete("1")
    ].reduce(reducer, initialState);

    expect(arc.getMultiple(state, (a:any) => a).length).toEqual(1);
    expect(arc.get(state, "1").name).toEqual("");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(page.get(state, "1").name).toEqual("Test Page");
});

it("should be able to tell whether entities exist", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
        page.add({id: "3", name: "Test Page"}),
    ].reduce(reducer, initialState);
    expect(arc.exists(state, "1")).toEqual(true);
    expect(arc.exists(state, "3")).toEqual(false);
});

it("should be able to clear entities", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
        page.add({id: "3", name: "Test Page"}),
        arc.clear(),
    ].reduce(reducer, initialState);
    expect(arc.exists(state, "1")).toEqual(false);
    expect(arc.exists(state, "2")).toEqual(false);
    expect(page.exists(state, "3")).toEqual(true);
});

it("should delete multiple entities", () => {
    const state = [
        arc.addMultiple([
            {id: "1", name: "Test Arc"},
            {id: "2", name: "Test Arc 2"},
            {id: "3", name: "Test Arc 3"},
            {id: "4", name: "Test Arc 4"},
            {id: "5", name: "Test Arc 5"},
        ]),
        arc.deleteMultiple(["1", "3", "5"])
    ].reduce(reducer, initialState);

    expect(arc.getMultiple(state, (a:any) => a).length).toEqual(2);
    expect(arc.get(state, "1").name).toEqual("");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(arc.get(state, "3").name).toEqual("");
    expect(arc.get(state, "4").name).toEqual("Test Arc 4");
    expect(arc.get(state, "5").name).toEqual("");
});

it("should be able to fetch multiple entities", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
    ].reduce(reducer, initialState);

    const arcs = arc.getMultiple(state, (a:any) => a);

    expect(arcs.length).toEqual(2);
    expect(arcs[0].name).toEqual("Test Arc");
    expect(arcs[1].name).toEqual("Test Arc 2");
});

it("should be able to fetch and filter multiple entities", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
    ].reduce(reducer, initialState);

    const arcs = arc.getMultiple(state, (a:Partial<IComicArc>) => a.id === "2");

    expect(arcs.length).toEqual(1);
    expect(arcs[0].name).toEqual("Test Arc 2");
});

it("can fetch children", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),

        page.add({id: "1", name: "Test Page", arcId: "1"}),
        page.add({id: "2", name: "Test Page 2", arcId: "1"}),
        page.add({id: "3", name: "Test Page 3", arcId: "2"}),
    ].reduce(reducer, initialState);

    const pages = arc.pages(state, "1");

    expect(pages.length).toEqual(2);
    expect(pages[0].name).toEqual("Test Page");
    expect(pages[1].name).toEqual("Test Page 2");
});

it("can fetch parents", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),

        page.add({id: "1", name: "Test Page", arcId: "1"}),
        page.add({id: "2", name: "Test Page 2", arcId: "1"}),
        page.add({id: "3", name: "Test Page 3", arcId: "2"}),
    ].reduce(reducer, initialState);
    
    expect(page.arc(state, "1").name).toEqual("Test Arc");
    expect(page.arc(state, "3").name).toEqual("Test Arc 2");
});

it("can fetch related entities", () => {
    const state = [
        page.add({id: "1", name: "Test Page"}),
        page.add({id: "2", name: "Test Page 2"}),

        media.add({id: "1", fileName: "testFile.png"}),
        media.add({id: "2", fileName: "testFile2.png"}),
        media.add({id: "3", fileName: "testFile3.png"}),
        media.add({id: "4", fileName: "testFile4.png"}),

        pageMedia.add({id: "1", mediaId: "1", pageId: "1"}),
        pageMedia.add({id: "2", mediaId: "2", pageId: "1"}),
        pageMedia.add({id: "3", mediaId: "3", pageId: "1"}),
        pageMedia.add({id: "4", mediaId: "4", pageId: "1"}),
        pageMedia.add({id: "5", mediaId: "1", pageId: "2"}),
        pageMedia.add({id: "6", mediaId: "2", pageId: "2"}),
    ].reduce(reducer, initialState);

    const page1Media = page.files(state, "1");
    const page2Media = page.files(state, "2");
    const media1Pages = media.pages(state, "1");
    const media2Pages = media.pages(state, "2");
    const media3Pages = media.pages(state, "3");
    const media4Pages = media.pages(state, "4");

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
