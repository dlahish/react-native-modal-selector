'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {
    View,
    Modal,
    Text,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
    ViewPropTypes as RNViewPropTypes,
    Animated,
} from 'react-native';

import styles from './style';

const ViewPropTypes = RNViewPropTypes || View.propTypes;

let componentIndex = 0;

const propTypes = {
    data:                           PropTypes.array,
    onChange:                       PropTypes.func,
    initValue:                      PropTypes.string,
    animationType:                  Modal.propTypes.animationType,
    style:                          ViewPropTypes.style,
    selectStyle:                    ViewPropTypes.style,
    selectTextStyle:                Text.propTypes.style,
    optionStyle:                    ViewPropTypes.style,
    optionTextStyle:                Text.propTypes.style,
    optionContainerStyle:           ViewPropTypes.style,
    sectionStyle:                   ViewPropTypes.style,
    sectionTextStyle:               Text.propTypes.style,
    cancelContainerStyle:           ViewPropTypes.style,
    cancelStyle:                    ViewPropTypes.style,
    cancelTextStyle:                Text.propTypes.style,
    overlayStyle:                   ViewPropTypes.style,
    cancelText:                     PropTypes.string,
    disabled:                       PropTypes.bool,
    supportedOrientations:          Modal.propTypes.supportedOrientations,
    keyboardShouldPersistTaps:      PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backdropPressToClose:           PropTypes.bool,
    accessible:                     PropTypes.bool,
    scrollViewAccessibilityLabel:   PropTypes.string,
    cancelButtonAccessibilityLabel: PropTypes.string,
    modalVisible:                   PropTypes.bool,
    showRootElement:                PropTypes.bool,
    renderRow:                      PropTypes.func,
    onModalVisibleChange:           PropTypes.func,
};

const defaultProps = {
    data:                           [],
    onChange:                       () => {},
    initValue:                      'Select me!',
    animationType:                  'slide',
    style:                          {},
    selectStyle:                    {},
    selectTextStyle:                {},
    optionStyle:                    {},
    optionTextStyle:                {},
    optionContainerStyle:           {},
    sectionStyle:                   {},
    sectionTextStyle:               {},
    cancelContainerStyle:           {},
    cancelStyle:                    {},
    cancelTextStyle:                {},
    overlayStyle:                   {},
    cancelText:                     'cancel',
    disabled:                       false,
    supportedOrientations:          ['portrait', 'landscape'],
    keyboardShouldPersistTaps:      'always',
    backdropPressToClose:           false,
    accessible:                     false,
    scrollViewAccessibilityLabel:   undefined,
    cancelButtonAccessibilityLabel: undefined,
    modalVisible:                   false,
    showRootElement:                true,
};

export default class ModalSelector extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            modalVisible:  false,
            selected:      props.initValue,
            cancelText:    props.cancelText,
            changedItem:   undefined,
            anim: new Animated.Value(0),
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.modalVisible && nextProps.modalVisible) {
            this.setState({modalVisible: true}, () => {
                Animated.timing(this.state.anim, {
                    duration: 450,
                    toValue: 1,
                }).start();
            })
        } else if (this.state.modalVisible && !nextProps.modalVisible) {
            this.setState({modalVisible: false})
        }

        if (nextProps.initValue !== this.props.initValue) {
            this.setState({selected: nextProps.initValue});
        }
    }

    onChange = (item) => {
        if (Platform.OS === 'android' || !Modal.propTypes.onDismiss) {
            // RN >= 0.50 on iOS comes with the onDismiss prop for Modal which solves RN issue #10471
            this.props.onChange(item);
        }
        this.setState({selected: item.label, changedItem: item });
        this.close();
    }

    close = () => {
        this.state.anim.setValue(0)
        this.setState({
            modalVisible: false,
        });
        this.props.onModalVisibleChange && this.props.onModalVisibleChange(false);
    }

    open = () => {
        this.setState({
            modalVisible: true,
            changedItem:  undefined,
        }, () => {
            Animated.timing(this.state.anim, {
                duration: 450,
                toValue: 1,
            }).start();
        });
        this.props.onModalVisibleChange && this.props.onModalVisibleChange(true);
    }

    renderSection = (section) => {
        return (
            <View key={section.key} style={[styles.sectionStyle,this.props.sectionStyle]}>
                <Text style={[styles.sectionTextStyle,this.props.sectionTextStyle]}>{section.label}</Text>
            </View>
        );
    }

    renderOption = (option, isLastItem, index) => {
        if (this.props.renderRow) {
            return this.props.renderRow(option, isLastItem, index, this.close)
        } else {
            return (
                <TouchableOpacity key={option.key} onPress={() => this.onChange(option)}
                                  accessible={this.props.accessible}
                                  accessibilityLabel={option.accessibilityLabel || undefined}>
                    <View style={[styles.optionStyle, this.props.optionStyle, isLastItem &&
                    {borderBottomWidth: 0}]}>
                        <Text style={[styles.optionTextStyle, this.props.optionTextStyle]}>{option.label}</Text>
                    </View>
                </TouchableOpacity>);
        }
    }

    renderOptionList = () => {

        let options = this.props.data.map((item, index) => {
            if (item.section) {
                return this.renderSection(item);
            }
            return this.renderOption(item, index === this.props.data.length - 1, index);
        });

        const closeOverlay = this.props.backdropPressToClose;

        return (
            <TouchableWithoutFeedback key={'modalSelector' + (componentIndex++)} onPress={() => {
                closeOverlay && this.close();
            }}>
                <View style={[styles.overlayStyle, this.props.overlayStyle]}>
                    <Animated.View style={[{flex: 1, justifyContent: 'flex-end'}, {
                        transform: [
                            {
                                translateY: this.props.animationType === 'none'
                                    ? this.state.anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [400, 0],
                                    })
                                    : 0,
                            }],
                    }]}>
                        <View style={[styles.optionContainer, this.props.optionContainerStyle]}>
                            <ScrollView
                                keyboardShouldPersistTaps={this.props.keyboardShouldPersistTaps}
                                accessible={this.props.accessible}
                                accessibilityLabel={this.props.scrollViewAccessibilityLabel}
                            >
                                {options}
                            </ScrollView>
                        </View>
                        <View style={[styles.cancelContainer, this.props.cancelContainerStyle]}>
                            <TouchableOpacity onPress={this.close} accessible={this.props.accessible} accessibilityLabel={this.props.cancelButtonAccessibilityLabel}>
                                <View style={[styles.cancelStyle, this.props.cancelStyle]}>
                                    <Text style={[styles.cancelTextStyle,this.props.cancelTextStyle]}>{this.props.cancelText}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>);
    }

    renderChildren = () => {

        if(this.props.children) {
            return this.props.children;
        }
        return (
            <View style={[styles.selectStyle, this.props.selectStyle]}>
                <Text style={[styles.selectTextStyle, this.props.selectTextStyle]}>{this.state.selected}</Text>
            </View>
        );
    }

    render() {

        const dp = (
            <Modal
                transparent={true}
                ref={element => this.model = element}
                supportedOrientations={this.props.supportedOrientations}
                visible={this.state.modalVisible}
                onRequestClose={this.close}
                animationType={this.props.animationType}
                onDismiss={() => this.state.changedItem && this.props.onChange(this.state.changedItem)}
            >
                {this.renderOptionList()}
            </Modal>
        );

        return (
            <View style={this.props.style}>
                {dp}
                {this.props.showRootElement &&
                <TouchableOpacity onPress={this.open} disabled={this.props.disabled}>
                    <View pointerEvents="none">
                        {this.renderChildren()}
                    </View>
                </TouchableOpacity>}
            </View>
        );
    }
}

ModalSelector.propTypes = propTypes;
ModalSelector.defaultProps = defaultProps;
