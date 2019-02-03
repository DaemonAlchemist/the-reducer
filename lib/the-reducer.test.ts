import { entity, getChildren, getParent, getRelated, theReducer } from './the-reducer';
import { ChildSelector, Entity, IEntityAction, IEntityContainer, IEntityReducer, ParentSelector, RelatedSelector } from './the-reducer.types';
import { combineReducers } from 'redux';

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

const reducer = combineReducers({
    theReducer: theReducer(arc, page, toggle, media, pageMedia)
});
const initialState = {theReducer: {}};

it('should insert objects into an empty store', () => {
    const state = [
        toggle.show("test")
    ].reduce(reducer, initialState);

    expect(toggle.isOn(state, "test")).toEqual(true);
});

it('should only update specified objects', () => {
    const state = [
        toggle.show("test"),
        toggle.show("test2"),
        toggle.hide("test"),
    ].reduce(reducer, initialState);

    expect(toggle.isOn(state, "test")).toEqual(false);
    expect(toggle.isOn(state, "test2")).toEqual(true);
});

it("should not update objects of other types with the same id", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        page.add({id: "1", name: "Test Page"}),
    ].reduce(reducer, initialState);

    expect(arc.get(state, "1").name).toEqual("Test Arc");
    expect(page.get(state, "1").name).toEqual("Test Page");
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

it("should be able to fetch multiple objects", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
    ].reduce(reducer, initialState);

    const arcs = arc.getMultiple(state, (a:any) => a);

    expect(arcs.length).toEqual(2);
    expect(arcs[0].name).toEqual("Test Arc");
    expect(arcs[1].name).toEqual("Test Arc 2");
});

it("should be able to fetch and filter multiple objects", () => {
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
