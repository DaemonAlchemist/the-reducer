import { entity, getChildren, getParent, combineReducersResursive } from './the-reducer';
import { ChildSelector, Entity, IEntityAction, IEntityContainer, IEntityReducer, ParentSelector } from './the-reducer.types';
import * as merge from 'merge-deep';
import {_, prop} from 'atp-pointfree';

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

export interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
export const arc:IArcRedux = {
    ...entity<IComicArc>(arcDefinition),
    pages: getChildren<IComicPage>(pageDefinition, "arcId"),
};

export interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
}
export const page:IPageRedux = {
    ...entity<IComicPage>(pageDefinition),
    arc: getParent<IComicArc, IComicPage>(arcDefinition, pageDefinition, "arcId")
};

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
    show: (id:string) => IEntityAction;
    hide: (id:string) => IEntityAction;
    isOn: (state:IEntityContainer<IToggle>, id:string) => boolean;
}

export const t = entity<IToggle>(toggleDefinition);
export const toggle:IToggleRedux = {
    reducer: t.reducer,
    show: (id:string) => t.update({id, isVisible: true}),
    hide: (id:string) => t.update({id, isVisible: false}),
    isOn: (state:IEntityContainer<IToggle>, id:string) => (t.get(state, id) || {isVisible: false}).isVisible || false
};

const reducer = combineReducersResursive(merge(arc.reducer, page.reducer, toggle.reducer));

it('should insert objects into an empty store', () => {
    const state = [
        toggle.show("test")
    ].reduce(reducer, {});

    expect(toggle.isOn(state, "test")).toEqual(true);
});

it('should only update specified objects', () => {
    const state = [
        toggle.show("test"),
        toggle.show("test2"),
        toggle.hide("test"),
    ].reduce(reducer, {});

    expect(toggle.isOn(state, "test")).toEqual(false);
    expect(toggle.isOn(state, "test2")).toEqual(true);
});

it("should not update objects of other types with the same id", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        page.add({id: "1", name: "Test Page"}),
    ].reduce(reducer, {});

    expect(arc.get(state, "1").name).toEqual("Test Arc");
    expect(page.get(state, "1").name).toEqual("Test Page");
});

it("should return default objects for empty stores", () => {
    expect(toggle.isOn({}, "1")).toEqual(false);
    expect(arc.get({}, "1").name).toEqual("");
    expect(page.get({}, "1").name).toEqual("");
});

it("should delete objects without deleting other objects", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
        page.add({id: "1", name: "Test Page"}),
        arc.delete("1")
    ].reduce(reducer, {});

    expect(arc.getMultiple(state, (a:any) => a).length).toEqual(1);
    expect(arc.get(state, "1").name).toEqual("");
    expect(arc.get(state, "2").name).toEqual("Test Arc 2");
    expect(page.get(state, "1").name).toEqual("Test Page");
});

it("should be able to fetch multiple objects", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
    ].reduce(reducer, {});

    const arcs = arc.getMultiple(state, (a:any) => a);

    expect(arcs.length).toEqual(2);
    expect(arcs[0].name).toEqual("Test Arc");
    expect(arcs[1].name).toEqual("Test Arc 2");
});

it("should be able to fetch and filter multiple objects", () => {
    const state = [
        arc.add({id: "1", name: "Test Arc"}),
        arc.add({id: "2", name: "Test Arc 2"}),
    ].reduce(reducer, {});

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
    ].reduce(reducer, {});

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
    ].reduce(reducer, {});
    
    expect(page.arc(state, "1").name).toEqual("Test Arc");
    expect(page.arc(state, "3").name).toEqual("Test Arc 2");
});