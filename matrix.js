'use strict';
import _cloneDeep from 'lodash/cloneDeep.js';
import _concat from 'lodash/concat.js';
import _constant from 'lodash/constant.js';
import _filter from 'lodash/filter.js';
import _isEqual from 'lodash/isEqual.js';
import _isInteger from 'lodash/isInteger.js';
import _map from 'lodash/map.js';
import _some from 'lodash/some.js';
import _sum from 'lodash/sum.js';
import _times from 'lodash/times.js';
import _toArray from 'lodash/toArray.js';
import _uniq from 'lodash/uniq.js';
import _unzip from 'lodash/unzip.js';

export default class Matrix {
  constructor() {
    let args = _toArray(arguments);
    if (args.length === 1 && Array.isArray(args[0][0])) {
      args = args[0];
    }
    if (_uniq(_map(args, 'length')).length !== 1) {
      throw new Error('All rows must have the same length');
    }
    this.data = args;
    Object.freeze(this);
  }
  numRows() {
    return this.data.length;
  }
  numColumns() {
    return this.data[0].length;
  }
  get(rowIndex, columnIndex) {
    return this.data[rowIndex] ? this.data[rowIndex][columnIndex] : undefined;
  }
  getRow(rowIndex) {
    return new Matrix(this.data[rowIndex]);
  }
  getColumn(columnIndex) {
    return new Matrix(_map(this.data, (row) => [row[columnIndex]]));
  }
  sliceRows(startIndex, endIndex) {
    return new Matrix(this.data.slice(startIndex, endIndex));
  }
  sliceColumns(startIndex, endIndex) {
    return new Matrix(this.data.map((row) => row.slice(startIndex, endIndex)));
  }
  sliceBlock(startRowIndex, endRowIndex, startColumnIndex, endColumnIndex) {
    return this.sliceRows(startRowIndex, endRowIndex).sliceColumns(
      startColumnIndex,
      endColumnIndex,
    );
  }
  omitRow(rowIndex) {
    return new Matrix(_filter(this.data, (value, index) => index !== rowIndex));
  }
  omitColumn(columnIndex) {
    return new Matrix(
      this.data.map((row) =>
        row.filter((value, index) => index !== columnIndex),
      ),
    );
  }
  combineHorizontal(otherMatrix) {
    if (this.numRows() !== otherMatrix.numRows()) {
      throw new Error(
        'Cannot horizontally combine matrices with different numbers of rows',
      );
    }
    return new Matrix(
      this.data.map((row, index) => row.concat(otherMatrix.data[index])),
    );
  }
  combineVertical(otherMatrix) {
    if (this.numColumns() !== otherMatrix.numColumns()) {
      throw new Error(
        'Cannot vertically combine matrices with different numbers of columns',
      );
    }
    return new Matrix(this.data.concat(otherMatrix.data));
  }
  replace(rowIndex, columnIndex, value) {
    const newData = _cloneDeep(this.data);
    newData[rowIndex][columnIndex] = value;
    return new Matrix(newData);
  }
  transpose() {
    return new Matrix(_unzip(this.data));
  }
  _cofactorEntry(rowIndex, columnIndex) {
    return (
      ((rowIndex + columnIndex) % 2 ? -1 : 1) *
      this.omitRow(rowIndex).omitColumn(columnIndex).determinant()
    );
  }
  determinant() {
    if (!this.isSquare()) {
      throw new Error('Cannot compute the determinant of a non-square matrix');
    }
    if (this.numRows() === 1) {
      return this.get(0, 0);
    }
    let sum = 0;
    for (let i = 0; i < this.numRows(); i++) {
      if (this.get(0, i) === 0) {
        continue; // No need to recursively compute the determinant if the value at the current location is zero anyway
      }
      sum += this.get(0, i) * this._cofactorEntry(0, i);
    }
    return sum;
  }
  _cofactor() {
    if (!this.isSquare()) {
      throw new Error('Cannot compute the cofactor of a non-square matrix');
    }
    return new Matrix(
      _times(this.numRows(), (rowIndex) =>
        _times(this.numColumns(), (columnIndex) =>
          this._cofactorEntry(rowIndex, columnIndex),
        ),
      ),
    );
  }
  adjugate() {
    return this._cofactor().transpose();
  }
  inverse() {
    if (!this.isSquare()) {
      throw new Error('Cannot compute the inverse of a non-square matrix');
    }
    let det = this.determinant();
    if (!det) {
      throw new Error('Cannot compute the inverse of a singular matrix');
    }
    return this.adjugate().scale(1 / det);
  }
  _map(iteratee) {
    return new Matrix(this.data.map((row) => row.map(iteratee)));
  }
  _values() {
    return _concat(...this.data);
  }
  add(otherMatrix) {
    if (
      this.numRows() !== otherMatrix.numRows() ||
      this.numColumns() !== otherMatrix.numColumns()
    ) {
      throw new Error('Cannot add two matrices with different sizes');
    }
    return new Matrix(
      this.data.map((row, rowIndex) =>
        row.map(
          (value, columnIndex) =>
            this.get(rowIndex, columnIndex) +
            otherMatrix.get(rowIndex, columnIndex),
        ),
      ),
    );
  }
  subtract(otherMatrix) {
    return otherMatrix.scale(-1).add(this);
  }
  _baseMultiply(columnMatrix) {
    return _sum(
      _map(this.data[0], (value, index) => value * columnMatrix.get(index, 0)),
    );
  }
  multiply(otherMatrix) {
    if (this.numColumns() !== otherMatrix.numRows()) {
      throw new Error('Incompatible dimensions for multiplication');
    }
    return new Matrix(
      _times(this.numRows(), (rowIndex) =>
        _times(otherMatrix.numColumns(), (columnIndex) =>
          this.getRow(rowIndex)._baseMultiply(
            otherMatrix.getColumn(columnIndex),
          ),
        ),
      ),
    );
  }
  scale(scalar) {
    return this._map((value) => scalar * value);
  }
  pow(exponent) {
    if (!this.isSquare()) {
      throw new Error('Cannot raise a non-square matrix to an exponent');
    }
    if (!_isInteger(exponent)) {
      throw new Error('Cannot raise a matrix to a non-integer exponent');
    }
    if (exponent === 0) {
      return Matrix.identity(this.numRows());
    }
    if (exponent < 0) {
      return this.pow(-exponent).inverse();
    }
    if (exponent % 2) {
      return this.pow(exponent - 1).multiply(this);
    }
    const halfExponent = this.pow(exponent / 2);
    return halfExponent.multiply(halfExponent);
  }
  equals(otherMatrix) {
    return _isEqual(this, otherMatrix);
  }
  isSquare() {
    return this.numRows() === this.numColumns();
  }
  isSymmetric() {
    return this.transpose().equals(this);
  }
  isSkewSymmetric() {
    return this.transpose().scale(-1).equals(this);
  }
  isUpperTriangular() {
    for (let i = 0; i < this.numRows(); i++) {
      for (let j = 0; j < i; j++) {
        if (this.get(i, j)) {
          return false;
        }
      }
    }
    return true;
  }
  isLowerTriangular() {
    return this.transpose().isUpperTriangular();
  }
  isDiagonal() {
    return this.isUpperTriangular() && this.isLowerTriangular();
  }
  isIdentity() {
    return this.isSquare() && Matrix.identity(this.numRows()).equals(this);
  }
  isNonZero() {
    return _some(this._values());
  }
  isSingular() {
    return this.determinant() === 0;
  }
  static identity(size) {
    return new Matrix(
      _times(size, (rowIndex) =>
        _times(size, (columnIndex) => (rowIndex === columnIndex ? 1 : 0)),
      ),
    );
  }
  static zeros(numRows, numColumns) {
    return new Matrix(
      _times(numRows, _constant(_times(numColumns, _constant(0)))),
    );
  }
}
