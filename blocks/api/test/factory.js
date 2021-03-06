/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, switchToBlockType } from '../factory';
import { getBlockTypes, unregisterBlockType, setUnknownTypeHandler, registerBlockType } from '../registration';

describe( 'block factory', () => {
	const defaultBlockSettings = { save: noop };

	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'createBlock()', () => {
		it( 'should create a block given its blockType and attributes', () => {
			registerBlockType( 'core/test-block', {
				defaultAttributes: {
					includesDefault: true,
				},
				save: noop,
			} );
			const block = createBlock( 'core/test-block', {
				align: 'left',
			} );

			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {
				includesDefault: true,
				align: 'left',
			} );
			expect( typeof block.uid ).toBe( 'string' );
		} );
	} );

	describe( 'switchToBlockType()', () => {
		it( 'should switch the blockType of a block using the "transform form"', () => {
			registerBlockType( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/updated-text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toEqual( [ {
				uid: 1,
				name: 'core/updated-text-block',
				attributes: {
					value: 'chicken ribs',
				},
			} ] );
		} );

		it( 'should switch the blockType of a block using the "transform to"', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/updated-text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
			} );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toEqual( [ {
				uid: 1,
				name: 'core/updated-text-block',
				attributes: {
					value: 'chicken ribs',
				},
			} ] );
		} );

		it( 'should return null if no transformation is found', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toBeNull();
		} );

		it( 'should reject transformations that return null', () => {
			registerBlockType( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: () => null,
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toBeNull();
		} );

		it( 'should reject transformations that return an empty array', () => {
			registerBlockType( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: () => [],
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toBeNull();
		} );

		it( 'should reject single transformations that do not include block types', () => {
			registerBlockType( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return {
								attributes: {
									value: 'chicken ' + value,
								},
							};
						},
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toBeNull();
		} );

		it( 'should reject array transformations that do not include block types', () => {
			registerBlockType( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'core/updated-text-block', {
									value: 'chicken ' + value,
								} ),
								{
									attributes: {
										value: 'smoked ' + value,
									},
								},
							];
						},
					} ],
				},
				save: noop,
			} );
			registerBlockType( 'core/text-block', defaultBlockSettings );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toBeNull();
		} );

		it( 'should reject single transformations with unexpected block types', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return createBlock( 'core/text-block', {
								value: 'chicken ' + value,
							} );
						},
					} ],
				},
				save: noop,
			} );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toEqual( null );
		} );

		it( 'should reject array transformations with unexpected block types', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'core/text-block', {
									value: 'chicken ' + value,
								} ),
								createBlock( 'core/text-block', {
									value: 'smoked ' + value,
								} ),
							];
						},
					} ],
				},
				save: noop,
			} );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).toEqual( null );
		} );

		it( 'should accept valid array transformations', () => {
			registerBlockType( 'core/updated-text-block', defaultBlockSettings );
			registerBlockType( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								createBlock( 'core/text-block', {
									value: 'chicken ' + value,
								} ),
								createBlock( 'core/updated-text-block', {
									value: 'smoked ' + value,
								} ),
							];
						},
					} ],
				},
				save: noop,
			} );

			const block = {
				uid: 1,
				name: 'core/text-block',
				attributes: {
					value: 'ribs',
				},
			};

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			// Make sure the block UIDs are set as expected: the first
			// transformed block whose type matches the "destination" type gets
			// to keep the existing block's UID.
			expect( updatedBlock ).toHaveLength( 2 );
			expect( updatedBlock[ 0 ].uid ).toBeDefined();
			expect( updatedBlock[ 0 ].uid ).not.toEqual( 1 );
			expect( updatedBlock[ 1 ].uid ).toEqual( 1 );
			updatedBlock[ 0 ].uid = 2;

			expect( updatedBlock ).toEqual( [ {
				uid: 2,
				name: 'core/text-block',
				attributes: {
					value: 'chicken ribs',
				},
			}, {
				uid: 1,
				name: 'core/updated-text-block',
				attributes: {
					value: 'smoked ribs',
				},
			} ] );
		} );
	} );
} );
