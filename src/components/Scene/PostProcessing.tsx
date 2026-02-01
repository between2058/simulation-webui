import { EffectComposer, Bloom, SSAO, ToneMapping, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

export function PostProcessing() {
  return (
    <EffectComposer multisampling={4}>
      {/* Ambient Occlusion for depth */}
      <SSAO
        samples={31}
        radius={0.1}
        intensity={30}
        luminanceInfluence={0.1}
        color={new THREE.Color('black')}
      />

      {/* Bloom for glowing elements */}
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      {/* Tone mapping for better color range */}
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
      />

      {/* Subtle vignette */}
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Subtle chromatic aberration for sci-fi feel */}
      <ChromaticAberration
        offset={[0.0005, 0.0005]}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={true}
        modulationOffset={0.5}
      />
    </EffectComposer>
  );
}
