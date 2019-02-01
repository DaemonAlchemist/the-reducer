/**
 * Created by Andrea on 9/3/2017.
 */

import {assert} from 'chai';
import {
    at, concat, createIndex, flatten, juxt, partition, range,
    _, prop, props, map, subFrom, gt, filter, join, debug, identity,
    clone, remove, merge
} from 'atp-pointfree';

const people = [
    {name: "Andy", birthday: {year: 1979, month: 3, day: 22}, occupation: "Programmer"},
    {name: "Andrea", birthday: {year: 1982, month: 3, day: 5}, occupation: "Modeler"},
    {name: "Adrian", birthday: {year: 2015, month: 2, day: 25}, occupation: "Toddler"},
    {name: "Aeron", birthday: {year: 2017, month: 5, day: 1}, occupation: "Baby"}
];

const birthday = prop("birthday");
const month = prop("month");
const year = prop("year");
const day = prop("day");
const birthYear = _(year, "of", birthday);
const birthMonth = _(year, "of", birthday);
const birthDoM = _(day, "of", birthday);
const thisYear = new Date().getFullYear();
const name = prop("name");
const names = map(name);
const occupation = prop("occupation");
const occupations = map(occupation);
const ageIn = currentYear => _(subFrom(currentYear), birthYear);
const age = ageIn(thisYear);
const isAdultIn = year => _(gt(18), ageIn(year));
const isAdult = isAdultIn(thisYear);
const adultsIn = currentYear => filter(isAdultIn(currentYear));
const adults = adultsIn(thisYear);
const id = _(join, props(name, ":", age));
const ids = map(id);

describe('ATP-Point-Free', () => {
    describe("Array functions", () => {
        describe("at", () => {
            it('should return the element in the array at the given index', () => {
                assert.equal(at(0)([0, 1, 2]), 0);
                assert.equal(at(1)([0, 1, 2]), 1);
                assert.equal(at(2)([0, 1, 2]), 2);
            });
            it("should return undefined for out-of-bound indices", () => {
                assert.isUndefined(at(-1)([0, 1, 2]));
                assert.isUndefined(at(3)([0, 1, 2]));
            })
        });
        describe("concat", () => {
            it("should concatenate arrays", () => {
                assert.deepEqual(concat([2])([0, 1]), [0, 1, 2]);
            });
            it("should work on raw values", () => {
                assert.deepEqual(concat(1)(0), [0, 1]);
                assert.deepEqual(concat(2)([0, 1]), [0, 1, 2]);
                assert.deepEqual(concat([1, 2])(0), [0, 1, 2]);
            });
        });
        describe("createIndex", () => {
            it("should create an index for an array of items", () => {
                const getPeople = createIndex(prop("name"))(people);
                assert.equal(getPeople("Andy").occupation, "Programmer");
            });
            it("should return undefined for non-existent items", () => {
                const getPeople = createIndex(prop("name"))(people);
                assert.isUndefined(getPeople("I don't exist"));
            });
            it("should create references (not copies) of indexed objects", () => {
                const peopleCopy = people.map(clone);
                const getPeople = createIndex(prop("name"))(peopleCopy);
                peopleCopy[0].occupation = "Test";
                assert.equal(getPeople("Andy").occupation, "Test");
            });
        });
        describe("flatten", () => {
            it("should flatten arrays of arrays", () => {
                assert.deepEqual(flatten([[1, 2], [3, 4], [5, 6]]), [1, 2, 3, 4, 5, 6]);
            });
        });
        describe("filter", () => {
            it("should filter objects", () => {
                assert.deepEqual(filter(identity)({offset: 0, fileName: "Beg", pageSize: 10}), {fileName: "Beg", pageSize: 10});
            });
        });
        describe("juxt (props)", () => {
            it("should apply an array of functions to an object", () => {
                assert.deepEqual(
                    juxt(birthYear, occupation, id)(people[0]),
                    [1979, "Programmer", "Andy:39"]
                );
            });
            it("should pass through inline comments", () => {
                assert.deepEqual(
                    juxt(birthYear, "and", occupation, "and", id)(people[0]),
                    [1979, "and", "Programmer", "and", "Andy:39"]
                );
            });
        });
        describe("partition", () => {
            it("should organize objects according to an index function", () => {
                const p = partition(n => n % 2)([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                assert.deepEqual(p(0), [0, 2, 4, 6, 8]);
                assert.deepEqual(p(1), [1, 3, 5, 7, 9]);
            });
            it("should return an empty array for invalid partition indices", () => {
                const p = partition(n => n % 2)([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                assert.deepEqual(p(2), []);
            });
        });
        describe("range", () => {
            it("should produce a range of numbers from start to end, inclusive", () => {
                assert.deepEqual(range(1, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            });
            it("should handle reverse ordering", () => {
                assert.deepEqual(range(10, 1), [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
            });
            it("should handle single length ranges", () => {
                assert.deepEqual(range(1, 1), [1]);
            });
        });
    });
    describe("Object functions", () => {
        describe("clone", () => {
            it("should clone objects", () => {
                const obj1 = {a: 1, b: 2};
                let obj2 = clone(obj1);
                obj2.a = 3;
                obj2.b = 4;
                assert.equal(obj1.a, 1);
                assert.equal(obj1.b, 2);
            });
        });
        describe("remove", () => {
            it("should remove attributes from objects", () => {
                const obj = {a: 1, b: 2};
                assert.deepEqual(remove(["b"])(obj), {a: 1});
            });
            it("should not affect the original object", () => {
                const obj = {a: 1, b: 2};
                const obj2 = remove(["b"])(obj);
                assert.deepEqual(obj, {a: 1, b: 2});
            });
        });
        describe.only("merge", () => {
            it("should overwrite existing values with blank values", () => {
                const obj1 = {a: "a", b: "b"};
                const obj2 = {a: null};
                assert.deepEqual(merge(obj1, obj2), {a: null, b: "b"});
            });
            it("should not treat Sets as objects", () => {
                const set1 = new Set(['Banner']);
                const set2 = new Set(['Banner', 'Test']);
                const obj1 = {a: set1};
                const obj2 = {a: set2};
                assert.deepEqual(merge(obj1, obj2), obj2);
            });
        });
    });
    describe('compose', () => {
        it('should compose functions', () => {
            const adultIds = _(ids, adultsIn(2017));
            assert.deepEqual(["Andy:39", "Andrea:36"], adultIds(people));
        });
        it('should ignore inline comments', () => {
            const adultIds = _(ids, "of the", adultsIn(2017));
            assert.deepEqual(["Andy:39", "Andrea:36"], adultIds(people));
        });
    });
});
