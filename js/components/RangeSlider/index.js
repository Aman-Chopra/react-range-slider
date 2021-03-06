/* @flow */

import React, { Component, PropTypes } from 'react';
import Track from '../Track';
import HighlightedTrack from '../HighlightedTrack';
import Handle from '../Handle';
import styles from './styles';
import {
  has,
  stepValidator,
  getValueOrAlt,
} from '../../utils/common';
import {
  valueValidator,
  defaultValueValidator,
} from '../../utils/rangeSlider';

export default class RangeSlider extends Component {

  static propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: stepValidator,
    value: valueValidator,
    defaultValue: defaultValueValidator,
    tabIndex: PropTypes.number,
    onChange: PropTypes.func,
    afterChange: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    'aria-labelledby': PropTypes.string,
    wrapperClassName: PropTypes.string,
    trackClassName: PropTypes.string,
    disabledTrackClassName: PropTypes.string,
    highlightedTrackClassName: PropTypes.string,
    disabledHighlightedTrackClassName: PropTypes.string,
    handleClassName: PropTypes.string,
    disabledHandleClassName: PropTypes.string,
    wrapperStyle: PropTypes.object,
    trackStyle: PropTypes.object,
    disabledTrackStyle: PropTypes.object,
    highlightedTrackStyle: PropTypes.object,
    disabledHighlightedTrackStyle: PropTypes.object,
    handleStyle: PropTypes.object,
    focusedHandleStyle: PropTypes.object,
    hoveredHandleStyle: PropTypes.object,
    activeHandleStyle: PropTypes.object,
    disabledHandleStyle: PropTypes.object,
  };

  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    readOnly: false,
  };

  constructor(props: Object): void {
    super(props);
    let start;
    let end;
    if (has(props, 'value')) {
      if (props.value) {
        start = props.value.start;
        end = props.value.end;
      }
    } else if (props.defaultValue) {
      start = props.defaultValue.start;
      end = props.defaultValue.end;
    }
    this.state = {
      start,
      end,
      startHandleWidth: 0,//startheight
      endHandleWidth: 0,
    };
  }

  state: Object;

  componentWillReceiveProps(properties: Object): void {
    if (has(properties, 'value')) {
      this.setState({
        start: properties.value && properties.value.start,
        end: properties.value && properties.value.end,
      });
    }
    if (properties.style !== this.props.style) {
      this.style = {
        ...styles.wrapper,
        ...properties.wrapperStyle,
      };
    }
  }

  factor: number;
  trackLeft: number;
  start: number;
  end: number;

  _setFactor: Function = (track: Object): void => {
    const trackWidth = track.clientWidth;
    this.setState({
      trackWidth,
    });
    this.trackLeft = track.getBoundingClientRect().left;
  };

  _setHandleWidth: Function = ({ clientWidth }): void => {
    if (!this.state.handleWidth) {
      this.setState({
        handleWidth: clientWidth,
      });
    }
  };

  _startHandleMove: Function = (increase: number): void => {
    const { disabled, readOnly, step, min } = this.props;
    const { start } = this.state;
    if (!disabled && !readOnly) {
      const newStart = this._getStartValue(getValueOrAlt(start, min) + increase * step);
      if (newStart !== start) {
        this._updateState(newStart, this.state.end);
        this._onChange(newStart, this.state.end);
      }
    }
  };

  _endHandleMove: Function = (increase: number): void => {
    const { disabled, readOnly, step, max } = this.props;
    const { end } = this.state;
    if (!disabled && !readOnly) {
      const newEnd = this._getEndValue(getValueOrAlt(end, max) + increase * step);
      if (newEnd !== end) {
        this._updateState(this.state.start, newEnd);
        this._onChange(this.state.start, newEnd);
      }
    }
  };

  _onWrapperMouseDown: Function = (event: Object): void => {
    const { disabled, readOnly } = this.props;
    if (!disabled && !readOnly) {
      this._moveHandleToPosition(event.pageX);
    }
  };

  _onWrapperTouchStart: Function = (event: Object): void => {
    const { disabled, readOnly } = this.props;
    if (!disabled && !readOnly) {
      if (event.touches.length === 1) {
        event.preventDefault();
        this._moveHandleToPosition(event.touches[0].pageX);
      }
    }
  };

  _moveHandleToPosition: Function = (position: number): void => {
    const { disabled, readOnly } = this.props;
    if (!disabled && !readOnly) {
      const { start, end } = this.state;
      const { min, max } = this.props;
      const startPosition = getValueOrAlt(start, min) * this.factor;
      const endPosition = getValueOrAlt(end, max) * this.factor;
      const mouseDownPosition = position - this.trackLeft + (min * this.factor);
      if (Math.abs(mouseDownPosition - startPosition) < Math.abs(mouseDownPosition - endPosition) ||
        mouseDownPosition < startPosition) {
        let newStart = this._getStepValue(
          (mouseDownPosition - this.state.handleWidth / 2) / this.factor);
        newStart = this._getStartValue(newStart);
        if (newStart !== getValueOrAlt(start, min)) {
          this._updateState(newStart, end);
          this._onChange(newStart, end);
          this._afterChange(newStart, end);
        }
      } else {
        let newEnd = this._getStepValue(
          (mouseDownPosition - this.state.handleWidth / 2) / this.factor);
        newEnd = this._getEndValue(newEnd);
        if (newEnd !== getValueOrAlt(end, max)) {
          this._updateState(start, newEnd);
          this._onChange(start, newEnd);
          this._afterChange(start, newEnd);
        }
      }
    }
  };

  _getStepValue: Function = (position: number) => {
    const { step } = this.props;
    const remainder = position % step;
    if (remainder < step / 2) {
      return position - remainder;
    }
    return position - remainder + step;
  };

  _getStartValue(start: number): number {
    let startValue = start;
    if (startValue < this.props.min) {
      startValue = this.props.min;
    } else if (startValue > getValueOrAlt(this.state.end, this.props.max)) {
      startValue = getValueOrAlt(this.state.end, this.props.max);
    }
    return startValue;
  }

  _getEndValue(end: number): number {
    let endValue = end;
    if (endValue > this.props.max) {
      endValue = this.props.max;
    } else if (endValue < getValueOrAlt(this.state.start, this.props.min)) {
      endValue = getValueOrAlt(this.state.start, this.props.min);
    }
    return endValue;
  }

  _updateState: Function = (start: number, end: number): void => {
    if (!has(this.props, 'value')) {
      this.setState({
        start,
        end,
      });
    }
  };

  _onChange: Function = (start: number, end: number): void => {
    if (this.props.onChange) {
      this.props.onChange({
        start,
        end,
      });
    }
  };

  _afterChange: Function = (start: number, end: number): void => {
    if (this.props.afterChange) {
      this.props.afterChange({
        start: getValueOrAlt(start, this.state.start),
        end: getValueOrAlt(end, this.state.end),
      });
    }
  };

  style: Object = {
    ...styles.wrapper,
    ...this.props.wrapperStyle,
  };

  render(): Object {
    let startValue = 0;
    let endValue = 0;
    let percentageFactor = 1;
    this.factor = 1;
    const {
      handleWidth,
      trackWidth,
      start,
      end,
    } = this.state;
    const {
      id,
      min,
      max,
      step,
      name,
      tabIndex,
      disabled,
      readOnly,
      trackStyle,
      disabledTrackStyle,
      highlightedTrackStyle,
      disabledHighlightedTrackStyle,
      handleStyle,
      focusedHandleStyle,
      hoveredHandleStyle,
      activeHandleStyle,
      disabledHandleStyle,
      wrapperClassName,
      trackClassName,
      disabledTrackClassName,
      highlightedTrackClassName,
      disabledHighlightedTrackClassName,
      handleClassName,
      disabledHandleClassName,
    } = this.props;
    this.start = getValueOrAlt(start, min);
    this.end = getValueOrAlt(end, max);
    if (trackWidth && handleWidth) {
      const calculatedTrackWidth = trackWidth - handleWidth;
      this.factor = calculatedTrackWidth / (max - min);
      if (this.start < min || this.end < min) {
        startValue = min;
      } else if (this.start > Math.min(this.end, max)) {
        startValue = Math.min(this.end, max);
      } else {
        startValue = this.start;
      }
      startValue = (startValue - min) * getValueOrAlt(this.factor, 1);
      if (this.end > max || this.start > max) {
        endValue = max;
      } else if (this.end < Math.max(start, min)) {
        endValue = Math.max(start, min);
      } else {
        endValue = this.end;
      }
      endValue = (endValue - min) * getValueOrAlt(this.factor, 1);
      percentageFactor = 100 / trackWidth;
    }
    return (
      <div
        id={id}
        name={name}
        style={this.style}
        className={wrapperClassName}
        onClick={this._onWrapperMouseDown}
        onTouchStart={this._onWrapperTouchStart}
        role="slider"
        aria-labelledby={this.props['aria-labelledby']}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${start} - ${end}`}
        aria-orientation="horizontal"
        aria-disabled={disabled}
        aria-readonly={readOnly}
      >
        <Track
          style={trackStyle}
          disabledStyle={disabledTrackStyle}
          disabled={disabled}
          trackRef={this._setFactor}
          className={trackClassName}
          disabledClassName={disabledTrackClassName}
        />
        <HighlightedTrack
          disabled={disabled}
          style={highlightedTrackStyle}
          disabledStyle={disabledHighlightedTrackStyle}
          className={highlightedTrackClassName}
          left={`${startValue * percentageFactor}%`}
          width={`${(endValue - startValue) * percentageFactor}%`}
          className={highlightedTrackClassName}
          disabledClassName={disabledHighlightedTrackClassName}
        />
        <Handle
          disabled={disabled}
          readOnly={readOnly}
          left={`${startValue * percentageFactor}%`}
          tabIndex={disabled ? undefined : tabIndex || 0}
          handleRef={this._setHandleWidth}
          handleMove={this._startHandleMove}
          afterChange={this._afterChange}
          factor={this.factor}
          step={step}
          style={handleStyle}
          focusStyle={focusedHandleStyle}
          hoverStyle={hoveredHandleStyle}
          activeStyle={activeHandleStyle}
          disabledStyle={disabledHandleStyle}
          className={handleClassName}
          disabledClassName={disabledHandleClassName}
        />
        <Handle
          disabled={disabled}
          readOnly={readOnly}
          left={`${endValue * percentageFactor}%`}
          tabIndex={disabled ? undefined : tabIndex || 0}
          handleRef={this._setHandleWidth}
          handleMove={this._endHandleMove}
          afterChange={this._afterChange}
          factor={this.factor}
          step={step}
          style={handleStyle}
          focusStyle={focusedHandleStyle}
          hoverStyle={hoveredHandleStyle}
          activeStyle={activeHandleStyle}
          disabledStyle={disabledHandleStyle}
          className={handleClassName}
          disabledClassName={disabledHandleClassName}
        />
      </div>
    );
  }
}
